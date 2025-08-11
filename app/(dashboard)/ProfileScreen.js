import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Animated,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getUserData, refreshUserDataFromAPI, clearUserData, fetchWalletStatus } from '../../utils/userStorage';
import SideNavigation from '../../components/SideNavigation';
import BottomNavigation from '../../components/BottomNavigation';
import images from '../../assets/images';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletStatusActual, setWalletStatusActual] = useState(undefined);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  const PIN_STORAGE_KEY = 'userPinEnabled';

  // Wallet status mapping
  const getWalletStatusMeta = (statusCode) => {
    const code = statusCode != null ? String(statusCode) : undefined;
    switch (code) {
      case '0':
        return { label: 'Ready to use', color: COLORS.open };
      case '2':
        return { label: 'Registration required', color: '#FFA000' };
      case '20':
        return { label: 'OTP pending', color: '#FF9800' };
      default:
        return { label: 'Unknown', color: COLORS.closed };
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Load stored pin preference
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (stored != null) {
          setIsPinEnabled(stored === 'true');
        }
      } catch (_) {}
    })();
  }, []);

  // Prefer server user info for PIN status when available
  useEffect(() => {
    const pinStatus = userData?.userData?.pin_status;
    if (pinStatus === '1' || pinStatus === 1) {
      setIsPinEnabled(true);
      AsyncStorage.setItem(PIN_STORAGE_KEY, 'true').catch(() => {});
    } else if (pinStatus === '0' || pinStatus === 0) {
      setIsPinEnabled(false);
      AsyncStorage.setItem(PIN_STORAGE_KEY, 'false').catch(() => {});
    }
  }, [userData]);

  const onTogglePin = async (value) => {
    try {
      if (value) {
        // Start setup flow; keep toggle off until success
        setIsPinEnabled(false);
        navigation.navigate('PinVerifyScreen', { setup: true });
      } else {
        // Verify PIN first on a dedicated screen, then disable on success
        navigation.navigate('PinVerifyScreen', { verifyFor: 'disable' });
      }
    } catch (_) {
      // On error, revert to previous state if disabling
      if (!value) {
        setIsPinEnabled(true);
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const result = await refreshUserDataFromAPI();
        console.log('ProfileScreen - initial refresh result:', result);
        if (result?.ok) {
          const updated = await getUserData();
          if (isMountedRef.current) {
            setUserData(updated);
            console.log('ProfileScreen - state updated from storage after initial refresh');
          }
        }
        // Always fetch wallet status from dedicated API
        const walletResp = await fetchWalletStatus();
        if (walletResp?.ok) {
          setWalletStatusActual(walletResp.walletStatus);
        }
      } catch (error) {
        console.error('ProfileScreen - refreshUserDataFromAPI error:', error);
      }
    })();
  }, []);

  const loadUserData = async () => {
    try {
      if (isMountedRef.current) setIsLoading(true);
      const data = await getUserData();
      if (data && isMountedRef.current) {
        setUserData(data);
      }
      const walletResp = await fetchWalletStatus();
      if (walletResp?.ok && isMountedRef.current) {
        setWalletStatusActual(walletResp.walletStatus);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      if (isMountedRef.current) setIsRefreshing(true);
      console.log('ProfileScreen - Swipe refresh triggered, fetching fresh data from API...');
      
      // Call API to refresh and persist user data in storage
      const result = await refreshUserDataFromAPI();
      console.log('ProfileScreen - API refresh result:', result);

      if (result?.ok) {
        // Reload normalized data from storage (same shape as initial load)
        const updatedData = await getUserData();
        if (isMountedRef.current) {
          setUserData(updatedData);
          console.log('ProfileScreen - Profile data updated with fresh data from storage');
        }
      } else {
        console.warn('ProfileScreen - API refresh failed, keeping existing data');
        if (result?.data?.message) {
          Alert.alert('Refresh Error', result.data.message);
        }
      }
      // Fetch latest wallet status from dedicated API
      const walletResp = await fetchWalletStatus();
      if (walletResp?.ok && isMountedRef.current) {
        setWalletStatusActual(walletResp.walletStatus);
      }
    } catch (error) {
      console.error('ProfileScreen - Error during swipe refresh:', error);
      Alert.alert('Refresh Error', 'Failed to refresh profile data. Please try again.');
    } finally {
      if (isMountedRef.current) setIsRefreshing(false);
    }
  };

  // Refresh automatically when the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      handleRefresh();
      return () => {};
    }, [])
  );

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

  const handleLogout = () => {
    clearUserData();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  // Wallet CTAs removed to avoid redundancy with Wallet screen

  const handleTabPress = (tabId) => {
    switch (tabId) {
      case 'home':
        navigation.replace('HomeScreen');
        break;
      case 'wallet':
        navigation.replace('WalletScreen');
        break;
      case 'profile':
        // Already on profile screen
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person-circle" size={80} color={COLORS.primary} />
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {userData?.userName || 'User Name'}
          </Text>
          <Text style={styles.profilePhone}>
            {userData?.userMobile ? `+91 ${userData.userMobile}` : 'Phone not available'}
          </Text>
          {/* Wallet status moved to balance card */}
        </View>
      </View>
      {/* Wallet CTAs removed */}

      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>₹{userData?.userBalance || '0'}</Text>
        </View>
        {/* Credit Balance intentionally hidden as per requirement */}
        {/* Wallet Status row inside blue card */}
        {(() => {
          const meta = getWalletStatusMeta(walletStatusActual);
          return (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Wallet Status</Text>
              <Text style={styles.balanceAmount}>{meta.label}</Text>
            </View>
          );
        })()}
        {/* KYC row */}
        {(() => {
          const kycRaw = userData?.userData?.kyc_code ?? userData?.userData?.kyc_status;
          const kyc = kycRaw != null ? String(kycRaw) : undefined;
          if (kyc === '0') {
            return (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>KYC</Text>
                <TouchableOpacity style={styles.walletCtaButton} onPress={() => navigation.navigate('ProfileScreen')}>
                  <Text style={styles.walletCtaText}>Upgrade KYC</Text>
                </TouchableOpacity>
              </View>
            );
          }
          if (kyc === '1') {
            return (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>KYC</Text>
                <Text style={styles.balanceAmount}>Pending</Text>
              </View>
            );
          }
          return null;
        })()}
        
        {/* User PIN toggle */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>User PIN</Text>
          <Switch
            value={isPinEnabled}
            onValueChange={onTogglePin}
            trackColor={{ false: '#cfd8dc', true: COLORS.secondary800 }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>
    </View>
  );

  const renderInfoSection = (title, data) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.infoCard}>
        {data.map((item, index) => (
          <View key={index} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPersonalInfo = () => {
    if (!userData?.userData) return null;

    const personalData = [
      { label: 'First Name', value: userData.userData.name || 'Not available' },
      { label: 'Middle Name', value: userData.userData.middlename || 'Not available' },
      { label: 'Last Name', value: userData.userData.lastname || 'Not available' },
      { label: 'Gender', value: userData.userData.gender || 'Not available' },
      { label: 'Date of Birth', value: userData.userData.dob || 'Not available' },
      { label: 'Email', value: userData.userData.email || 'Not available' },
      { label: 'Mobile', value: userData.userData.mobile || 'Not available' },
      { label: 'Mother\'s Maiden Name', value: userData.userData.mothers_maiden_name || 'Not available' },
    ];

    return renderInfoSection('Personal Information', personalData);
  };

  const renderAddressInfo = () => {
    if (!userData?.userData) return null;

    const addressData = [
      { label: 'Address', value: userData.userData.address || 'Not available' },
      { label: 'City', value: userData.userData.city || 'Not available' },
      { label: 'State', value: userData.userData.state || 'Not available' },
      { label: 'Pincode', value: userData.userData.pincode || 'Not available' },
    ];

    return renderInfoSection('Address Information', addressData);
  };

  const renderAccountInfo = () => {
    if (!userData?.userData) return null;

    // KYC Status mapping
    const getKYCStatus = (kycCode) => {
      switch (kycCode) {
        case '0': return 'Non-KYC';
        case '1': return 'Documents Submitted';
        case '2': return 'KYC Verified';
        case '3': return 'KYC Check Approved';
        case '4': return 'KYC Approved';
        case '5': return 'Rejected';
        case '7': return 'Wallet Not Created';
        default: return 'Unknown';
      }
    };

    const kycCodeRaw = userData.userData.kyc_code ?? userData.userData.kyc_status;
    const kycCode = kycCodeRaw != null ? String(kycCodeRaw) : undefined;

    const accountData = [
      { label: 'KYC Status', value: kycCode ? getKYCStatus(kycCode) : 'Not available' },
      { label: 'ID Proof Type', value: userData.userData.id_proof_type || 'Not available' },
      { label: 'ID Proof Number', value: userData.userData.id_proof_no || 'Not available' },
      { label: 'Address Proof Type', value: userData.userData.add_proof_type || 'Not available' },
      { label: 'Address Proof Number', value: userData.userData.add_proof_no || 'Not available' },
    ];

    return renderInfoSection('Account Information', accountData);
  };



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#dae9ff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#dae9ff" />

      {/* TOP area (above safe area) */}
      <View style={{ height: insets.top, backgroundColor: '#dae9ff' }} />

      {/* SAFE area/content */}
      <View style={styles.pageRoot}>
        {/* Side Navigation */}
        {isSideNavOpen && (
          <SideNavigation
            isOpen={isSideNavOpen}
            onClose={toggleSideNav}
            slideAnim={slideAnim}
            fadeAnim={fadeAnim}
            onLogout={handleLogout}
          />
        )}

        {/* Header Section (match HomeScreen) */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.appName}>Medpass</Text>
            </View>
            <Text style={styles.headerPageTitle}>Profile</Text>
          </View>
        </View>

        <View style={styles.container}>
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#0065fb']}
                tintColor="#0065fb"
                title="Pull to refresh"
                titleColor="#0065fb"
              />
            }
          >
            {renderProfileSection()}
            {renderPersonalInfo()}
            {renderAddressInfo()}
            {/* Account Information hidden as requested */}
            
            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Edit FAB Button */}
          <TouchableOpacity 
            style={styles.editFab}
            onPress={() => {
              navigation.navigate('EditProfileScreen');
            }}
          >
            <Ionicons name="create" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Bottom Navigation */}
          <BottomNavigation activeTab="profile" onTabPress={handleTabPress} />
        </View>
      </View>

      {/* BOTTOM area (below safe area) */}
      <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#dae9ff',
  },
  pageRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Satoshi Variable',
  },
  header: {
    backgroundColor: '#dae9ff',
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 0,
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
  banner: {
    backgroundColor: COLORS.primary100,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Satoshi Variable',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  pillBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  pillBackInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
    marginLeft: 20,
  },
  menuBox: {
    width: 37,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 120, // Extra padding at bottom for FAB and bottom nav
    paddingTop: 20, // Extra padding at top
  },
  profileSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0c0c0d',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.open,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: COLORS.primary1000,
    marginBottom: 8,
  },
  profilePhone: {
    fontSize: 16,
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    color: COLORS.text,
    marginBottom: 12,
  },
  walletStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletStatusText: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  walletCtaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  walletCtaText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: COLORS.primary100,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3EEFF',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
    color: COLORS.text,
  },
  balanceAmount: {
    fontSize: 20,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: COLORS.primary1000,
  },
  statusInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: COLORS.primary1000,
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.underline,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0c0c0d',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    color: COLORS.primary1000,
    flex: 1,
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 40,
  },
  editFab: {
    position: 'absolute',
    bottom: 100, // Above the bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
