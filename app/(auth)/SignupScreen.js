import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ScrollView,
  Switch,
  Pressable,
  Keyboard
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import images from '../../assets/images';

const { width, height } = Dimensions.get('window');

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
            {/* Main image */}
            <View style={styles.imageContainer}>
              <Image source={images.image25} style={styles.mainImage} resizeMode="cover" />
            </View>

            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Image source={images.arrowLeft} style={styles.backButtonImage} />
            </TouchableOpacity>

            {/* Sign Up title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Sign Up</Text>
            </View>

            {/* Form inputs */}
            <View style={styles.formContainer}>
              {/* Name input */}
              <View style={styles.inputField}>
                <View style={styles.inputBackground} />
                <View style={styles.iconContainer}>
                  <Ionicons name="person" size={20} color="rgba(34,31,31,0.6)" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(34,31,31,0.4)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Email input */}
              <View style={styles.inputField}>
                <View style={styles.inputBackground} />
                <View style={styles.iconContainer}>
                  <MaterialIcons name="email" size={20} color="rgba(34,31,31,0.6)" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(34,31,31,0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Password input */}
              <View style={styles.inputField}>
                <View style={styles.inputBackground} />
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed" size={20} color="rgba(34,31,31,0.6)" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(34,31,31,0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <TouchableOpacity 
                  style={styles.eyeIconContainer} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={18} 
                    color="rgba(34,31,31,0.6)" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                {agreeToTerms && <View style={styles.checkmark} />}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the healthcare <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Sign In button */}
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => navigation.navigate('HomeScreen')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Have an account? <Text style={styles.loginLink} onPress={() => navigation.navigate('LoginScreen')}>Log In</Text>
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
  imageContainer: {
    position: 'absolute',
    top: 79,
    left: '50%',
    transform: [{ translateX: -105.5 }],
    width: 211,
    height: 195,
  },
  mainImage: {
    width: '100%',
    height: '100%',
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
  titleContainer: {
    position: 'absolute',
    top: 317.5,
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
  },
  title: {
    fontSize: 24,
    color: '#221f1f',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28.8,
  },
  formContainer: {
    position: 'absolute',
    top: 357,
    left: 36,
    width: 313,
  },
  inputField: {
    position: 'relative',
    height: 40,
    marginBottom: 16,
  },
  inputBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34,31,31,0.1)',
  },
  iconContainer: {
    position: 'absolute',
    left: 16,
    top: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    position: 'absolute',
    left: 50,
    top: 0,
    width: 217,
    height: 40,
    fontSize: 14,
    color: '#221f1f',
    paddingVertical: 12,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 16,
    top: 11,
    width: 20,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsContainer: {
    position: 'absolute',
    top: 537,
    left: 43,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 300,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(34,31,31,0.4)',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 17,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#0065fb',
    borderColor: '#0065fb',
  },
  checkmark: {
    width: 8,
    height: 8,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#221f1f',
    lineHeight: 16.8,
    fontWeight: '400',
  },
  termsLink: {
    color: '#407ce2',
  },
  signInButton: {
    position: 'absolute',
    top: 597,
    left: 36,
    width: width - 72,
    height: 48,
    backgroundColor: '#0065fb',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    lineHeight: 24,
  },
  loginContainer: {
    position: 'absolute',
    top: 663.5,
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -10.5 }],
    width: 240,
  },
  loginText: {
    fontSize: 14,
    color: '#221f1f',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: 0.5,
  },
  loginLink: {
    color: '#0065fb',
    fontWeight: 'bold',
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