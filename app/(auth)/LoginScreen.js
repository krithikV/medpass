import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Pressable,
  Keyboard,
  Alert,
  ActivityIndicator
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import images from '../../assets/images';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleGetOTP = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('mobile', phoneNumber);
      formData.append('otpstatus', '1');

      console.log('Sending OTP request for:', phoneNumber);

      const response = await fetch('https://api.mediimpact.in/index.php/User/UserReg', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('API Response:', data);

      // Navigate to OTP screen regardless of status
      console.log('Got API response, navigating to OTP screen');
      navigation.navigate('OTPScreen', { 
        phoneNumber,
        otp: data.otp || null, // Pass OTP if available
        apiResponse: data // Pass the full API response
      });

    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Network error. Please try again.');
      Alert.alert('Network Error', 'Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={dismissKeyboard}>
          <View style={styles.innerContainer}>
            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Image source={images.arrowLeft} style={styles.backIcon} />
            </TouchableOpacity>

            {/* Security illustration PNG */}
            <View style={styles.illustrationContainer}>
              <Image 
                source={images.securityGroup} 
                style={styles.securityImage}
                resizeMode="contain"
              />
            </View>

            {/* Title and subtitle */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Log in / Sign up</Text>
              <Text style={styles.subtitle}>
                We will send you a one-time password to this mobile number
              </Text>
            </View>

            {/* Phone input section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Enter Mobile Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder=""
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setError(''); // Clear error when user types
                  }}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                  blurOnSubmit={true}
                  maxLength={10}
                />
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            {/* Get OTP button */}
            <TouchableOpacity 
              style={[
                styles.otpButton,
                isLoading && styles.otpButtonDisabled
              ]}
              onPress={handleGetOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.otpButtonText}>Get OTP</Text>
              )}
            </TouchableOpacity>

            {/* Signup link removed per requirement */}

            {/* Bottom decoration */}
            <View style={styles.bottomDecoration}>
              <Image 
                source={images.rectangleAuthScreen} 
                style={styles.bottomImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  innerContainer: {
    flex: 1,
    minHeight: height,
  },
  backButton: {
    position: 'absolute',
    top: 49,
    left: 36,
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  illustrationContainer: {
    position: 'absolute',
    top: 110,
    left: '50%',
    transform: [{ translateX: -150 }],
    width: 300,
    height: 220,
  },
  securityImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    top: 432,
    left: '50%',
    transform: [{ translateX: -145.5 }],
    width: 291,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 24,
    color: '#3a3a3a',
    fontFamily: 'Satoshi Variable',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28.8,
  },
  subtitle: {
    fontSize: 12,
    color: '#3a3a3a',
    fontFamily: 'Satoshi Variable',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 14.4,
    width: 261,
  },
  inputSection: {
    position: 'absolute',
    top: 514,
    left: '50%',
    transform: [{ translateX: -156.5 }],
    width: 313,
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#0065fb',
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
    lineHeight: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f0ff',
    borderRadius: 37,
    height: 36,
    paddingLeft: 16,
  },
  countryCode: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    lineHeight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    height: '100%',
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 10,
    color: '#ff0000',
    fontFamily: 'Satoshi Variable',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
  },
  otpButton: {
    position: 'absolute',
    top: 597,
    left: 36,
    right: 36,
    backgroundColor: '#0065fb',
    borderRadius: 32,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  otpButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Satoshi',
    fontWeight: '500',
    lineHeight: 24,
  },
  signupContainer: {
    position: 'absolute',
    top: 660.5,
    left: '50%',
    transform: [{ translateX: -129 }, { translateY: -10.5 }],
    width: 258,
  },
  signupText: {
    fontSize: 14,
    color: '#221f1f',
    fontFamily: 'Satoshi',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: 0.5,
  },
  signupLink: {
    color: '#0065fb',
    fontFamily: 'Satoshi',
    fontWeight: '500',
    lineHeight: 21,
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