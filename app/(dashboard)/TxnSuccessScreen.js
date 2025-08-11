import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import images from '../../assets/images';

const COLORS = {
  primary: '#0065fb',
  secondary900: '#017f83',
  success200: '#15b097',
  baseWhite: '#fafafa',
  text: '#3a3a3a',
  white: '#ffffff',
};

export default function TxnSuccessScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const amount = route?.params?.amount || '0';

  const [seconds, setSeconds] = useState(3);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the tick image
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scaleAnim]);

  useEffect(() => {
    // Countdown timer - only updates local state
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Navigate after commit when seconds hits 0
    if (seconds === 0) {
      navigation.replace('WalletScreen');
    }
  }, [seconds, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.success200 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.success200} />
      <View style={{ height: insets.top }} />

      <View style={styles.container}>
        <View style={styles.imageWrap}>
          <Animated.Image source={images.txnSuccess} style={[styles.image, { transform: [{ scale: scaleAnim }] }]} resizeMode="contain" />
        </View>

        <View style={styles.pill}>
          <Text style={styles.pillText}>Amount Paid</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountText}>₹ {amount}</Text>
        </View>

        <Text style={styles.redirectText}>Redirecting to Wallet in {seconds}…</Text>
      </View>

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageWrap: {
    width: '80%',
    maxWidth: 340,
    aspectRatio: 1,
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pill: {
    backgroundColor: '#017f83',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 32,
    marginBottom: 12,
  },
  pillText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
  },
  amountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  amountText: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: '700',
  },
  redirectText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
});
