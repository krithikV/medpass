import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import images from '../../assets/images';

const { width, height } = Dimensions.get('window');

export default function WelcomeUserScreen({ navigation, route }) {
  // Get user name from navigation params, default to "Selvarani"
  const userName = route?.params?.userName || 'Selvarani';

  useEffect(() => {
    // Auto redirect to HomeScreen after 3 seconds
    const timer = setTimeout(() => {
      navigation.navigate('HomeScreen');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Medical Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={images.medicalLogo} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Welcome Text */}
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.nameText}>{userName}</Text>
        <Text style={styles.subtitleText}>You're all set to use Medpass</Text>
      </View>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <Image 
          source={images.rectangleAuthScreen} 
          style={styles.bottomImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: 346,
    left: '50%',
    marginLeft: -57.5, // Use marginLeft instead of transform for better centering
    width: 115,
    height: 89,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    top: 498,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#3a3a3a',
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21.6, // 1.2 * 18
    marginBottom: 4,
  },
  nameText: {
    fontSize: 40,
    color: '#3a3a3a',
    fontFamily: 'Satoshi Variable',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 48, // 1.2 * 40
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16.8,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: -208,
    width: 620,
    height: 105,
    zIndex: 1,
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
}); 