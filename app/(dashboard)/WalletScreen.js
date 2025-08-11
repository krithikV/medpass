import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getUserData, clearUserData, refreshUserDataFromAPI, fetchWalletStatus } from '../../utils/userStorage';
import SideNavigation from '../../components/SideNavigation';
import BottomNavigation from '../../components/BottomNavigation';
import images from '../../assets/images';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0065fb',
  primary100: '#dae9ff',
  primary1000: '#002965',
  secondary800: '#01a1a6',
  text: '#3a3a3a',
  white: '#ffffff',
  chipText: '#0065fb',
  underline: '#01a1a6',
  open: '#4CAF50',
  closed: '#F44336',
};

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletStatusActual, setWalletStatusActual] = useState(undefined);
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cashback, setCashback] = useState(null);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const fetchUserInfoCashback = async (creds) => {
    try {
      const token = creds?.token;
      const userId = creds?.userId;
      if (!token || !userId) return;
      const resp = await fetch('http://api.mediimpact.in/index.php/User/User_info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token,
          'User-ID': userId,
          version: '10007',
        },
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data) {
        const cb = Number(data?.cashback ?? data?.user_data?.cashback);
        if (Number.isFinite(cb)) setCashback(cb);
      }
    } catch (_) {}
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const data = await getUserData();
      if (data) {
        setUserData(data);
        // Fetch transactions once credentials are present
        fetchTransactions(data);
        // Fetch cashback from User/User_info
        fetchUserInfoCashback(data);
      }
      const walletResp = await fetchWalletStatus();
      if (walletResp?.ok) {
        setWalletStatusActual(walletResp.walletStatus);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (creds) => {
    try {
      const token = creds?.token;
      const userId = creds?.userId;
      if (!token || !userId) return;
      setIsTxLoading(true);
      const resp = await fetch('http://api.mediimpact.in/index.php/Wallet/transactionReport', {
        method: 'GET',
        headers: {
          token,
          'User-ID': userId,
        },
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.status === 200 && Array.isArray(data.tr_data)) {
        setTransactions(data.tr_data);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error('fetch transactions error', e);
      setTransactions([]);
    } finally {
      setIsTxLoading(false);
    }
  };

  const refreshWallet = async () => {
    try {
      setIsRefreshing(true);
      // Refresh user meta (balance etc.)
      const result = await refreshUserDataFromAPI();
      if (result?.ok) {
        const updated = await getUserData();
        setUserData(updated);
        await fetchTransactions(updated);
        await fetchUserInfoCashback(updated);
        // Also refresh wallet status from dedicated API
        const walletResp = await fetchWalletStatus();
        if (walletResp?.ok) {
          setWalletStatusActual(walletResp.walletStatus);
        }
      } else if (userData) {
        await fetchTransactions(userData);
        await fetchUserInfoCashback(userData);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSideNav = () => {
    if (isSideNavOpen) {
      // Close animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsSideNavOpen(false);
      });
    } else {
      // Open animation
      setIsSideNavOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const walletNeedsOTP = walletStatusActual != null && String(walletStatusActual) !== '0';

  const handleOtpInputChange = (value, index) => {
    if (value.length > 1) {
      const digits = value.split('').slice(0, 5);
      const next = [...otp];
      for (let i = 0; i < 5; i++) next[i] = digits[i] || '';
      setOtp(next);
      const focusIndex = Math.min(digits.length, 4);
      setTimeout(() => inputRefs.current[focusIndex]?.focus(), 50);
      return;
    }
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendWalletOTP = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      if (!userData?.token || !userData?.userId) {
        Alert.alert('Missing credentials', 'Please login again.');
        return;
      }
      setIsResending(true);
      const body = new URLSearchParams();
      body.append('otp', '');
      body.append('transaction_id', '');
      const resp = await fetch('http://api.mediimpact.in/index.php/Wallet/resendUserRegOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token: userData.token,
          'User-ID': userData.userId,
          version: '10007',
        },
        body: body.toString(),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.message || 'Failed to resend OTP');
      }
      Alert.alert('OTP Sent', 'We have sent an OTP to your registered mobile number.');
      // start cooldown (e.g., 30 seconds)
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('resend wallet otp error', e);
      Alert.alert('Error', e.message || 'Could not resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyWalletOTP = async () => {
    const code = otp.join('');
    if (code.length !== 5) {
      Alert.alert('Incomplete OTP', 'Please enter all 5 digits');
      return;
    }
    try {
      if (!userData?.token || !userData?.userId) {
        Alert.alert('Missing credentials', 'Please login again.');
        return;
      }
      setIsVerifying(true);
      const body = new URLSearchParams();
      body.append('otp', code);
      const resp = await fetch('http://api.mediimpact.in/index.php/Wallet/otp_validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token: userData.token,
          'User-ID': userData.userId,
          version: '10007',
        },
        body: body.toString(),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || (data?.status && data.status !== 200)) {
        throw new Error(data?.message || 'OTP verification failed');
      }
      // Refresh user data to update wallet status
      const result = await refreshUserDataFromAPI();
      if (result?.ok) {
        const updated = await getUserData();
        setUserData(updated);
      }
      const walletResp = await fetchWalletStatus();
      if (walletResp?.ok) {
        setWalletStatusActual(walletResp.walletStatus);
      }
      Alert.alert('Verified', 'Wallet OTP verified successfully.');
    } catch (e) {
      console.error('verify wallet otp error', e);
      Alert.alert('Error', e.message || 'OTP verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    clearUserData();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const handleTabPress = (tabId) => {
    switch (tabId) {
      case 'home':
        navigation.replace('HomeScreen');
        break;
      case 'wallet':
        // Already on wallet screen
        break;
      case 'profile':
        navigation.replace('ProfileScreen');
        break;
      default:
        break;
    }
  };

  const monthSpent = useMemo(() => {
    try {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const parseYMD = (s) => {
        if (!s) return null;
        const str = String(s).trim();
        // Try YYYY-MM-DD
        let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return { y: parseInt(m[1], 10), m: parseInt(m[2], 10) - 1 };
        // Try DD/MM/YYYY
        m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) return { y: parseInt(m[3], 10), m: parseInt(m[2], 10) - 1 };
        // Fallback to Date
        const d = new Date(str.replace(' ', 'T'));
        if (!Number.isNaN(d.getTime())) return { y: d.getFullYear(), m: d.getMonth() };
        return null;
      };

      let total = 0;
      (transactions || []).forEach((t) => {
        const when = parseYMD(t?.created);
        if (!when || when.y !== thisYear || when.m !== thisMonth) return;

        // Determine debit: prefer amount sign, then drcr, then type heuristic
        const amtNum = (() => {
          const raw = String(t?.amount ?? '0');
          const cleaned = raw.replace(/[^0-9.-]/g, '');
          const n = parseFloat(cleaned);
          return Number.isFinite(n) ? n : 0;
        })();

        const drcr = String(t?.drcr ?? '').toUpperCase();
        const typeStr = String(t?.type ?? '').toUpperCase();
        const isCreditBySign = amtNum > 0 && rawHasPlus(t?.amount);
        const isDebitBySign = amtNum < 0;
        const isDebitByDrcr = /^D/.test(drcr);
        const isCreditByDrcr = /^C/.test(drcr);
        const isCreditByType = ['1', '4', 'C', 'CREDIT'].includes(typeStr);

        const isDebit = isDebitBySign || (!isCreditBySign && (isDebitByDrcr || (!isCreditByDrcr && !isCreditByType)));
        if (!isDebit) return;

        const add = Math.abs(amtNum);
        if (Number.isFinite(add)) total += add;
      });

      return total;
    } catch (_) {
      return 0;
    }

    function rawHasPlus(v) {
      try { return String(v).includes('+'); } catch { return false; }
    }
  }, [transactions]);

  const renderMonthlySummaryCard = () => {
    const limit = Number(userData?.userData?.monthly_limit);
    const hasLimit = Number.isFinite(limit) && limit > 0;
    const spent = Number.isFinite(monthSpent) ? monthSpent : 0;
    const pct = hasLimit ? Math.min(100, Math.max(0, (spent / limit) * 100)) : 0;
    const kycCodeRaw = userData?.userData?.kyc_code ?? userData?.userData?.kyc_status;
    const kyc = kycCodeRaw != null ? String(kycCodeRaw) : undefined;
    return (
      <View style={styles.monthlyLimitCard}>
        <View style={styles.monthlyHeaderRow}>
          <Text style={styles.monthlyTitle}>This Month</Text>
          <Text style={styles.monthlyValue}>
            ₹{spent.toFixed(2)}{hasLimit ? ` / ₹${limit.toFixed(2)}` : ''}
          </Text>
        </View>
        {hasLimit ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        ) : null}
        {/* KYC actions */}
        {kyc === '0' ? (
          <TouchableOpacity style={styles.monthlyKycBtn} onPress={() => navigation.navigate('ProfileScreen')}>
            <Text style={styles.monthlyKycBtnText}>Upgrade KYC</Text>
          </TouchableOpacity>
        ) : kyc === '1' ? (
          <Text style={styles.monthlyKycInfo}>Awaiting KYC approval…</Text>
        ) : null}
      </View>
    );
  };

  const renderMoneySavedCard = () => {
    const savedAmount = (cashback != null ? cashback : (userData?.userData?.cc_balance ?? '0'));
    const available = userData?.userBalance ?? '0';
    return (
      <View style={styles.moneySavedCard}>
        <Text style={styles.moneySavedLabel}>Money Saved</Text>
        <Text style={styles.moneySavedValue}>₹{String(savedAmount)}</Text>
        <View style={styles.cardBottomRow}>
          <View style={styles.balanceChip}>
            <Text style={styles.balanceChipLabel}>Balance Available</Text>
            <Text style={styles.balanceChipValue}>₹{String(available)}</Text>
          </View>
          <TouchableOpacity style={styles.addMoneyPill} onPress={() => navigation.navigate('AddMoneyScreen')}>
            <Ionicons name="add" size={22} color={COLORS.primary} />
            <Text style={styles.addMoneyPillText}>Add money</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  const renderTransactionItem = (type, amount, description, date, isCredit = true) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: isCredit ? '#e8f5e8' : '#ffe8e8' }]}>
          <Ionicons 
            name={isCredit ? 'add-circle' : 'remove-circle'} 
            size={24} 
            color={isCredit ? '#4CAF50' : '#F44336'} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{description}</Text>
          <Text style={styles.transactionDate}>{date}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: isCredit ? '#4CAF50' : '#F44336' }]}>
        {isCredit ? '+' : '-'}₹{amount}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#dae9ff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#dae9ff" />
        <View style={{ height: insets.top, backgroundColor: '#dae9ff' }} />
        <View style={[styles.loadingContainer, { backgroundColor: '#ffffff' }]}>
          <Text>Loading wallet...</Text>
        </View>
        <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
      </View>
    );
  }

  // When wallet is not ready (status !== '0'), show inline OTP UI
  if (!isLoading && walletNeedsOTP) {
    return (
      <View style={{ flex: 1, backgroundColor: '#dae9ff' }}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
        <View style={{ height: insets.top, backgroundColor: '#dae9ff' }} />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
                <Text style={styles.appName}>Medpass</Text>
              </View>
              <Text style={styles.headerPageTitle}>Wallet</Text>
            </View>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshWallet} />}
          >
            <View style={styles.otpCard}>
              <Text style={styles.otpTitle}>Enter Wallet OTP</Text>
              <Text style={styles.otpSubtitle}>Please enter the 5-digit OTP sent to your registered mobile number.</Text>

              <View style={styles.otpInputsRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpInputChange(v, index)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={5}
                    textAlign="center"
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.verifyBtn, (isVerifying) && styles.verifyBtnDisabled]}
                onPress={handleVerifyWalletOTP}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.resendBtn, (isResending || resendCooldown>0) && styles.resendBtnDisabled]} onPress={handleResendWalletOTP} disabled={isResending || resendCooldown>0}>
                {isResending ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : resendCooldown > 0 ? (
                  <Text style={styles.resendText}>Resend in {resendCooldown}s</Text>
                ) : (
                  <Text style={styles.resendText}>Resend OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.replace('ProfileScreen')}>
                <Text style={styles.completeProfileText}>Complete profile to get OTP</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          <BottomNavigation activeTab="wallet" onTabPress={handleTabPress} />

          {isSideNavOpen && (
            <SideNavigation
              isOpen={isSideNavOpen}
              onClose={toggleSideNav}
              slideAnim={slideAnim}
              fadeAnim={fadeAnim}
              onLogout={handleLogout}
              navigation={navigation}
            />
          )}
        </View>
        <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#dae9ff' }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
      {/* TOP area (above safe area) */}
      <View style={{ height: insets.top, backgroundColor: '#dae9ff' }} />
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.appName}>Medpass</Text>
            </View>
            <Text style={styles.headerPageTitle}>Wallet</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshWallet} />}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Static summary card */}
          {renderMoneySavedCard()}
          {renderMonthlySummaryCard()}

          {/* Scrollable transactions only */}
          <ScrollView
            style={styles.transactionsScroll}
            contentContainerStyle={styles.transactionsContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.transactionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
              </View>
              {isTxLoading ? (
                <Text style={styles.transactionDate}>Loading transactions...</Text>
              ) : transactions.length === 0 ? (
                <Text style={styles.transactionDate}>No transactions found.</Text>
              ) : (
                transactions.map((t, idx) => {
                  const typeStr = String(t?.type ?? '');
                  const isCredit = typeStr === '1' || typeStr === '4';
                  const desc = `${t?.api ?? ''}${t?.provider_name ? ` - ${t.provider_name}` : ''}`.trim();
                  return (
                    <React.Fragment key={`${t.transaction_id || idx}`}>
                      {renderTransactionItem(
                        typeStr,
                        String(t?.amount ?? ''),
                        desc || 'Transaction',
                        t?.created || '',
                        isCredit
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab="wallet" onTabPress={handleTabPress} />

        {/* Side Navigation */}
        {isSideNavOpen && (
          <SideNavigation
            isOpen={isSideNavOpen}
            onClose={toggleSideNav}
            slideAnim={slideAnim}
            fadeAnim={fadeAnim}
            onLogout={handleLogout}
            navigation={navigation}
          />
        )}
      </View>
      {/* BOTTOM area (below safe area) */}
      <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary100,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.primary100,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 48,
    height: 36,
    marginRight: 9,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Satoshi',
    fontWeight: '500',
    color: '#017f83',
    letterSpacing: -2,
  },
  headerPageTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi',
    fontWeight: '600',
    color: '#017f83',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionsScroll: {
    flex: 1,
  },
  transactionsContent: {
    paddingBottom: 100,
  },
  otpCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 48,
    backgroundColor: '#e7f0ff',
    borderRadius: 8,
    fontSize: 20,
    color: '#000000',
    fontFamily: 'Satoshi',
  },
  otpInputFilled: {
    backgroundColor: '#e7f0ff',
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: 'Satoshi',
    fontWeight: '500',
  },
  resendBtn: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  resendBtnDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  completeProfileText: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
  walletCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moneySavedCard: {
    backgroundColor: '#017f83',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  moneySavedLabel: {
    color: '#d9feff',
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  moneySavedValue: {
    color: '#ffffff',
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 40,
    marginBottom: 12,
  },
  balanceChip: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  cardBottomRow: {
    width: '100%',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceChipLabel: {
    color: COLORS.text,
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 6,
  },
  balanceChipValue: {
    color: COLORS.primary1000,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 24,
  },
  addMoneyPill: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMoneyPillText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: 'Satoshi',
    fontWeight: '600',
    marginLeft: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addMoneyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addMoneyText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#666',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: COLORS.white,
    width: (width - 44) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  monthlyLimitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  monthlyValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#eef3ff',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  monthlyKycBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  monthlyKycBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  monthlyKycInfo: {
    marginTop: 10,
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});
