import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserData } from '../../utils/userStorage';
import BottomNavigation from '../../components/BottomNavigation';
import images from '../../assets/images';

const COLORS = {
  primary: '#0065fb',
  primary100: '#dae9ff',
  primary1000: '#002965',
  secondary900: '#017f83',
  secondary100: '#d9feff',
  text: '#3a3a3a',
  white: '#ffffff',
};

export default function PaymentScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [amount, setAmount] = useState('');
  const [prn, setPrn] = useState('');
  const [comments, setComments] = useState('');
  const amountInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const serviceName = route?.params?.serviceName || 'Service';
  const serviceId = route?.params?.serviceId || '';

  useEffect(() => {
    (async () => {
      try {
        const { needsFirstName } = require('../../utils/userStorage');
        const shouldRedirect = await needsFirstName();
        if (shouldRedirect) {
          navigation.replace('WalletScreen');
          return;
        }
      } catch (_) {}
      const data = await getUserData();
      setUserData(data);
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const handlePay = async () => {
    const numeric = Number(amount);
    const balanceNum = Number(userData?.userBalance || 0);
    if (!amount || Number.isNaN(numeric) || numeric < 1) {
      return;
    }
    if (Number.isFinite(balanceNum) && numeric > balanceNum) {
      return;
    }

    // If PIN is enabled, verify before proceeding
    const isPinEnabled = userData?.userData?.pin_status === '1' || userData?.userData?.pin_status === 1;
    if (isPinEnabled) {
      navigation.navigate('PinVerifyScreen', {
        verifyFor: 'payment',
        payment: { serviceId, amount: String(numeric), desc: 'Consultation payment' },
      });
      return;
    }

    if (!userData?.token || !userData?.userId || !serviceId) {
      return;
    }

    try {
      setIsLoading(true);

      const body = new URLSearchParams();
      body.append('service_id', String(serviceId));
      body.append('amount', String(numeric));
      body.append('prn', prn ? String(prn) : '');
      body.append('ba_code', '');
      body.append('desc', comments ? String(comments) : '');
      body.append('partycode', '');

      const resp = await fetch('https://api.mediimpact.in/index.php/Wallet/makeTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token: userData.token,
          'User-ID': userData.userId,
          version: '10007',
        },
        body: body.toString(),
      });

      const data = await resp.json();
      if (resp.ok && data?.status === 200) {
        // On success, go to transaction success screen
        navigation.replace('TxnSuccessScreen', { amount: String(numeric) });
      } else {
        // Silent failure per prior UX guidance (no dialogs on failure)
      }
    } catch (_) {
      // Swallow errors silently per requirement
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary100 }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
      <View style={{ height: insets.top, backgroundColor: COLORS.primary100 }} />

      <View style={styles.pageRoot}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary1000} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.appName}>Medpass</Text>
            </View>
            <Text style={styles.headerPageTitle} numberOfLines={1}>Send Money</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
          <ScrollView style={styles.content} contentContainerStyle={styles.centerContent}>
            {/* Service name above amount */}
            <Text style={styles.serviceNameText} numberOfLines={2}>
              {serviceName}
            </Text>
            {/* Centered amount input */}
            <View style={styles.centerAmountWrap}>
              <Text style={styles.centerCurrency}>₹</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.centerAmountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#99A"
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"
                textAlign="center"
                autoFocus
              />
            </View>

            {/* Optional PRN and Comments */}
            <View style={styles.optionalRow}>
              <TextInput
                style={styles.smallInput}
                placeholder="PRN (optional)"
                placeholderTextColor="#99A"
                value={prn}
                onChangeText={setPrn}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.smallInput, { marginLeft: 8 }]}
                placeholder="Comments (optional)"
                placeholderTextColor="#99A"
                value={comments}
                onChangeText={setComments}
                returnKeyType="done"
              />
            </View>

            {/* Small subtitle for balance */}
            <Text style={styles.centerSubtitle}>Balance ₹{userData?.userBalance || '0'}</Text>

            {/* Primary CTA */}
            <TouchableOpacity 
              style={[
                styles.addButton,
                ((!amount || Number(amount) < 1 || (Number(userData?.userBalance||0) < Number(amount))) || isLoading) && styles.addButtonDisabled,
              ]}
              onPress={handlePay}
              disabled={!amount || Number(amount) < 1 || (Number(userData?.userBalance||0) < Number(amount)) || isLoading}
            >
              <Text style={styles.addButtonText}>{isLoading ? 'Processing…' : 'Pay'}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom nav */}
          <BottomNavigation activeTab="wallet" onTabPress={(tab) => {
            if (tab === 'wallet') return;
            if (tab === 'home') navigation.replace('HomeScreen');
            if (tab === 'profile') navigation.replace('ProfileScreen');
          }} />
        </KeyboardAvoidingView>
      </View>

      <View style={{ height: insets.bottom, backgroundColor: COLORS.white }} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  serviceNameText: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.primary1000,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: COLORS.primary100,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    maxWidth: 120,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120,
  },
  centerAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  centerCurrency: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 28,
    color: COLORS.primary1000,
    marginRight: 6,
  },
  centerAmountInput: {
    minWidth: 160,
    borderBottomWidth: 0,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 40,
    color: COLORS.primary1000,
    paddingVertical: 6,
  },
  centerSubtitle: {
    marginTop: 4,
    color: '#666666',
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'stretch',
    marginHorizontal: 36,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    fontSize: 16,
  },
  optionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  smallInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E3EEFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontFamily: 'Satoshi Variable',
    fontSize: 13,
    color: COLORS.primary1000,
    backgroundColor: COLORS.white,
  },
});
