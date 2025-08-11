import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import images from '../../assets/images';
import { isUserLoggedIn } from '../../utils/userStorage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        const isLoggedIn = await isUserLoggedIn();
        if (isLoggedIn) {
          // If user is already logged in, go directly to home
          navigation.navigate('HomeScreen');
        } else {
          // If not logged in, wait 3 seconds then go to auth
          const timer = setTimeout(() => {
            if (navigation) {
              navigation.navigate('Auth');
            }
          }, 3000);
          
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        // On error, default to auth screen after 3 seconds
        const timer = setTimeout(() => {
          if (navigation) {
            navigation.navigate('Auth');
          }
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    checkAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0065fb', '#0052cc']}
        style={styles.background}
      />
      
      {/* Circular elements using styled circles */}
      <View style={styles.circle1}>
        <View style={styles.circle1Inner} />
      </View>
      <View style={styles.circle2}>
        <View style={styles.circle2Inner} />
      </View>
      <View style={styles.circle3}>
        <View style={styles.circle3Inner} />
      </View>
      
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
        <Text style={styles.welcomeText}>Welcome,</Text>
        <Text style={styles.appName}>Medpass</Text>
      </View>
      
      {/* Bottom content with line and text */}
      <View style={styles.bottomContent}>
        <View style={styles.lineContainer}>
          <View style={styles.line} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.saveText}>
            <Text style={styles.highlightText}>Save money</Text>
            <Text style={styles.regularText}> on each transaction</Text>
          </Text>
        </View>
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
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -194 },
      { translateY: -194 + 21 }
    ],
  },
  circle1Inner: {
    position: 'absolute',
    width: '102%',
    height: '102%',
    borderRadius: 194,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    top: '-1%',
    left: '-1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  circle2: {
    position: 'absolute',
    width: 295,
    height: 294,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -147.5 },
      { translateY: -147.5 + 21 }
    ],
  },
  circle2Inner: {
    width: '100%',
    height: '100%',
    borderRadius: 147.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  circle3: {
    position: 'absolute',
    width: 232,
    height: 233,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -116 + 0.5 },
      { translateY: -116 + 20.5 }
    ],
  },
  circle3Inner: {
    width: '100%',
    height: '100%',
    borderRadius: 116,
    backgroundColor: 'rgba(255, 255, 255,1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 115,
    height: 89,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [
      { translateX: -57.5 },
      { translateY: -44.5 + 20.5 }
    ],
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  welcomeContainer: {
    position: 'absolute',
    top: 167,
    left: 32,
    transform: [{ translateY: -50 }],
  },
  welcomeText: {
    fontSize: 40,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: '300',
    marginBottom: 0,
    letterSpacing: -2,
  },
  appName: {
    fontSize: 64,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: '500',
    letterSpacing: -2,
  },
  bottomContent: {
    position: 'absolute',
    top: 681,
    left: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lineContainer: {
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 55,
    height: 2,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '270deg' }],
  },
  textContainer: {
    width: 300,
  },
  saveText: {
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: '500',
    lineHeight: 28.8,
  },
  highlightText: {
    color: '#8dfc63',
  },
  regularText: {
    color: '#ffffff',
  },
}); 