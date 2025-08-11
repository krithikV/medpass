import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import images from '../../assets/images';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0065fb', '#0052cc']}
        style={styles.background}
      />
      
      {/* Circular elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={images.logo}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      {/* Welcome text */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Let's get started!</Text>
        <Text style={styles.subtitleText}>Login to Stay healthy and fit</Text>
      </View>
      
      {/* Auth buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => {
            console.log('Signup button pressed');
            navigation.navigate('SignupScreen');
          }}
        >
          <Text style={styles.signupButtonText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0065fb',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    width: 387,
    height: 388,
    borderRadius: 194,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -194 },
      { translateY: -194 - 225 }
    ],
  },
  circle2: {
    position: 'absolute',
    width: 295,
    height: 294,
    borderRadius: 147.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -147.5 - 1 },
      { translateY: -147.5 - 224 }
    ],
  },
  circle3: {
    position: 'absolute',
    width: 173,
    height: 173,
    borderRadius: 86.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -86.5 - 1 },
      { translateY: -86.5 - 223.5 }
    ],
  },
  logoContainer: {
    position: 'absolute',
    left: 133,
    top: 156,
    width: 115,
    height: 89,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  welcomeContainer: {
    position: 'absolute',
    top: 435,
    left: 38,
    right: 38,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32.4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    top: 532,
    left: 32,
    right: 32,
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loginButtonText: {
    fontSize: 16,
    color: '#0065fb',
    fontFamily: 'System',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  signupButton: {
    backgroundColor: '#0065fb',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  signupButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 