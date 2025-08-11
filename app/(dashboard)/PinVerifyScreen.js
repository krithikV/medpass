import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Animated, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const COLORS = {
  primary: '#0065fb',
  primary100: '#dae9ff',
  primary1000: '#002965',
  secondary900: '#017f83',
  text: '#3a3a3a',
  white: '#ffffff',
  danger: '#e53935',
};

const PIN_ENABLED_KEY = 'userPinEnabled';
const PIN_CODE_KEY = 'userPinCode';

export default function PinVerifyScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [storedPin, setStoredPin] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const hiddenInputRef = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const nextRoute = route?.params?.nextRoute;
  const isSetup = route?.params?.setup === true;
  const verifyFor = route?.params?.verifyFor; // e.g., 'disable' | 'payment'
  const [firstEntry, setFirstEntry] = useState(null);

  useEffect(() => {
    (async () => {
      const [enabledRaw, savedPin] = await Promise.all([
        AsyncStorage.getItem(PIN_ENABLED_KEY),
        AsyncStorage.getItem(PIN_CODE_KEY),
      ]);
      setIsEnabled(enabledRaw === 'true');
      if (savedPin && savedPin.length === 4) setStoredPin(savedPin);
      // focus keyboard shortly after mount
      setTimeout(() => hiddenInputRef.current?.focus(), 250);
    })();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (isSetup) {
        handleSetupFlow();
      } else {
        handleVerifyFlow();
      }
    }
  }, [pin]);

  const handleSetupFlow = async () => {
    if (firstEntry == null) {
      setFirstEntry(pin);
      setPin('');
      setError('Re-enter PIN');
      setTimeout(() => hiddenInputRef.current?.focus(), 50);
      return;
    }
    if (firstEntry !== pin) {
      setError('PINs do not match. Try again.');
      triggerShake();
      setTimeout(() => {
        setFirstEntry(null);
        setPin('');
        setError('');
        hiddenInputRef.current?.focus();
      }, 500);
      return;
    }

    // Call API to set pin and enable
    try {
      setIsLoading(true);
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userId'),
      ]);
      const body = new URLSearchParams();
      body.append('pin', pin);
      body.append('pin_status', '1');
      const resp = await fetch('http://api.mediimpact.in/index.php/User/setPin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token: token || '',
          'User-ID': userId || '',
          version: '10007',
        },
        body: body.toString(),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.status !== 200) {
        setError(json?.message || 'Failed to set PIN');
        triggerShake();
        setIsLoading(false);
        setTimeout(() => {
          setFirstEntry(null);
          setPin('');
          setError('');
          hiddenInputRef.current?.focus();
        }, 800);
        return;
      }
      await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(PIN_CODE_KEY, pin);
      // Success
      onSuccess();
    } catch (e) {
      setError('Network error');
      triggerShake();
      setTimeout(() => {
        setFirstEntry(null);
        setPin('');
        setError('');
        hiddenInputRef.current?.focus();
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyFlow = async () => {
    setIsLoading(true);
    // If verifying for disable or server verification is required, call API
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userId'),
      ]);
      if (isEnabled) {
        const body = new URLSearchParams();
        body.append('pin', pin);
        const resp = await fetch('http://api.mediimpact.in/index.php/User/checkPin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            token: token || '',
            'User-ID': userId || '',
            version: '10007',
          },
          body: body.toString(),
        });
        const json = await resp.json().catch(() => ({}));
        if (json?.status !== 200) {
          setError(json?.message || 'Invalid PIN');
          triggerShake();
          setTimeout(() => {
            setPin('');
            setError('');
            hiddenInputRef.current?.focus();
          }, 600);
          return;
        }
        // If verifying for disable, proceed to disable after successful verify
        if (verifyFor === 'disable') {
          await disablePinOnServer(token, userId);
          return;
        } else if (verifyFor === 'payment') {
          await proceedPaymentAfterVerify(token, userId);
          return;
        }
      }
      // If not enabled or just normal verify, success
      onSuccess();
    } catch (_) {
      setError('Network error');
      triggerShake();
      setTimeout(() => {
        setPin('');
        setError('');
        hiddenInputRef.current?.focus();
      }, 600);
    } finally {
      setIsLoading(false);
    }
  };

  const disablePinOnServer = async (token, userId) => {
    try {
      const body = new URLSearchParams();
      body.append('pin', '');
      body.append('pin_status', '0');
      const resp = await fetch('http://api.mediimpact.in/index.php/User/setPin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token: token || '',
          'User-ID': userId || '',
          version: '10007',
        },
        body: body.toString(),
      });
      const json = await resp.json().catch(() => ({}));
      if (json?.status !== 200) {
        setError(json?.message || 'Failed to disable PIN');
        triggerShake();
        setTimeout(() => {
          setPin('');
          setError('');
          hiddenInputRef.current?.focus();
        }, 600);
        return;
      }
      await AsyncStorage.setItem(PIN_ENABLED_KEY, 'false');
      await AsyncStorage.removeItem(PIN_CODE_KEY);
      onSuccess();
    } catch (_) {
      setError('Network error');
      triggerShake();
      setTimeout(() => {
        setPin('');
        setError('');
        hiddenInputRef.current?.focus();
      }, 600);
    }
  };

  const proceedPaymentAfterVerify = async (token, userId) => {
    try {
      const payment = route?.params?.payment || {};
      const { serviceId, amount, desc } = payment;
      if (!serviceId || !amount) {
        onSuccess();
        return;
      }
      const body = new URLSearchParams();
      body.append('service_id', String(serviceId));
      body.append('amount', String(amount));
      body.append('prn', '');
      body.append('ba_code', '');
      body.append('desc', desc || 'Consultation payment');
      body.append('partycode', '');
      const resp = await fetch('http://api.mediimpact.in/index.php/Wallet/makeTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          token: token || '',
          'User-ID': userId || '',
          version: '10007',
        },
        body: body.toString(),
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok && json?.status === 200) {
        navigation.replace('TxnSuccessScreen', { amount: String(amount) });
      } else {
        // Keep silent per flow; optionally could show error here
        navigation.goBack();
      }
    } catch (_) {
      navigation.goBack();
    }
  };

  const onSuccess = () => {
    navigation.goBack();
  };

  const renderBoxes = () => {
    const digits = pin.split('');
    return (
      <TouchableOpacity activeOpacity={1} onPress={() => hiddenInputRef.current?.focus()}>
        <Animated.View style={[styles.boxRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.box, error && error.startsWith('Incorrect') ? styles.boxError : null]}>
              <Text style={styles.boxText}>{digits[i] || ''}</Text>
            </View>
          ))}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary100 }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
      <View style={{ height: insets.top, backgroundColor: COLORS.primary100 }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary1000} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isSetup ? 'Set PIN' : verifyFor === 'disable' ? 'Verify PIN to Disable' : 'Verify PIN'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          <Text style={styles.subtitle}>{isSetup ? (firstEntry == null ? 'Enter a new 4-digit PIN' : 'Re-enter PIN to confirm') : 'Enter your 4-digit PIN'}</Text>
          {renderBoxes()}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {isLoading ? <ActivityIndicator color={COLORS.secondary900} style={{ marginTop: 12 }} /> : null}

          {/* Hidden input drives the 4 boxes */}
          <TextInput
            ref={hiddenInputRef}
            style={styles.hiddenInput}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            maxLength={4}
            autoFocus
          />
      </KeyboardAwareScrollView>

      <View style={{ height: insets.bottom, backgroundColor: COLORS.white }} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary900,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  boxRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  box: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e3eeff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f9ff',
  },
  boxError: {
    borderColor: COLORS.danger,
  },
  boxText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary1000,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
