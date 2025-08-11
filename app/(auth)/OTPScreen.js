import React, { useState, useRef } from 'react';
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
import { storeUserData } from '../../utils/userStorage';
import images from '../../assets/images';

const { width, height } = Dimensions.get('window');

export default function OTPScreen({ navigation, route }) {
  const [otp, setOtp] = useState(['', '', '', '', '']); // Changed to 5 digits
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);
  const { phoneNumber, apiResponse } = route.params || {};

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleOtpChange = (value, index) => {
    // Check if this looks like a paste operation (value is longer than expected)
    if (value.length > 1) {
      // This is likely a paste operation
      const digits = value.split('').slice(0, 5); // Take only first 5 digits
      const newOtp = [...otp];
      
      // Fill all input fields with pasted digits
      for (let i = 0; i < 5; i++) {
        newOtp[i] = digits[i] || '';
      }
      
      setOtp(newOtp);
      
      // Focus the last filled input or the last input if all filled
      const lastFilledIndex = Math.min(digits.length - 1, 4);
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex]?.focus();
      }
    } else {
      // Single digit input (original behavior)
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Alternative approach: handle paste by detecting input length
  const handleInputChange = (value, index) => {
    // If the value is longer than 1, it's likely a paste
    if (value.length > 1) {
      const digits = value.split('').slice(0, 5);
      const newOtp = [...otp];
      
      // Fill all fields with pasted digits
      for (let i = 0; i < 5; i++) {
        newOtp[i] = digits[i] || '';
      }
      
      setOtp(newOtp);
      
      // Focus after the last filled digit
      const focusIndex = Math.min(digits.length, 4);
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 100);
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    console.log('OTP entered:', otpCode);
    
    // Check if all 5 digits are entered
    if (otpCode.length !== 5) {
      Alert.alert('Incomplete OTP', 'Please enter all 5 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append('mobile', phoneNumber);
      formData.append('otp', otpCode);
      formData.append('username', '');

      console.log('Verifying OTP for:', phoneNumber, 'OTP:', otpCode);

      const response = await fetch('https://api.mediimpact.in/index.php/User/verify_otp', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('OTP Verification Response:', data);

      if (data.status === 200) {
        // Success - store user data and navigate directly (no success dialog)
        const storageSuccess = await storeUserData(data, phoneNumber);
        if (storageSuccess) {
          navigation.navigate('WelcomeUserScreen', { 
            userName: data.name,
            userId: data.userId
          });
        } else {
          Alert.alert('Storage Error', 'Login successful but failed to save user data. Please try again.');
        }
      } else {
        // Handle verification failure
        Alert.alert('Verification Failed', data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Network Error', 'Please check your internet connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const isVerifyEnabled = otp.every(digit => digit !== '') && !isVerifying; // All 5 digits must be filled and not verifying
  
  console.log('Current OTP:', otp);
  console.log('Is Verify Enabled:', isVerifyEnabled);

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
              <Image 
                source={images.arrowLeft} 
                style={styles.backButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Security illustration */}
            <View style={styles.illustrationContainer}>
              <Image 
                source={images.securityGroup} 
                style={styles.securityImage}
                resizeMode="contain"
              />
            </View>

            {/* Title and subtitle */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Enter your OTP</Text>
              <Text style={styles.subtitle}>
                Enter the OTP sent to +91 <Text style={styles.phoneNumber}>{phoneNumber}</Text>
              </Text>
            </View>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => inputRefs.current[index] = ref}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(value) => handleInputChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={5} // Allow up to 5 characters for paste detection
                  textAlign="center"
                  selectTextOnFocus={true}
                  returnKeyType={index === 4 ? "done" : "next"}
                  onSubmitEditing={index === 4 ? dismissKeyboard : () => {}}
                  contextMenuHidden={false} // Allow context menu for paste
                  autoComplete="off"
                  autoCorrect={false}
                />
              ))}
            </View>

            {/* Verify button */}
            <TouchableOpacity 
              style={[styles.verifyButton, !isVerifyEnabled && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={!isVerifyEnabled}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={[styles.verifyButtonText, !isVerifyEnabled && styles.verifyButtonTextDisabled]}>
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Already have an account? <Text style={styles.signupLink} onPress={() => navigation.navigate('SignupScreen')}>Sign Up</Text>
              </Text>
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
  backButtonImage: {
    width: 24,
    height: 24,
    tintColor: '#000',
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
    gap: 8,
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
    fontSize: 16,
    color: '#3a3a3a',
    fontFamily: 'Satoshi Variable',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 19.2,
  },
  phoneNumber: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '500',
  },
  otpContainer: {
    position: 'absolute',
    top: 532,
    left: '50%',
    transform: [{ translateX: -156.5 }],
    width: 313,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpInput: {
    width: 48,
    height: 37,
    backgroundColor: '#e7f0ff',
    borderRadius: 8,
    fontSize: 24,
    color: '#000000',
    fontFamily: 'Satoshi',
    fontWeight: '400',
    textAlign: 'center',
    paddingVertical: 0,
  },
  otpInputFilled: {
    backgroundColor: '#e7f0ff',
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: '#0065fb',
    opacity: 0.4,
  },
  verifyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Satoshi',
    fontWeight: '500',
    lineHeight: 24,
  },
  verifyButtonTextDisabled: {
    opacity: 0.4,
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