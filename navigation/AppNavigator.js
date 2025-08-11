import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { isUserLoggedIn } from '../utils/userStorage';

// Import auth screens
import WelcomeScreen from '../app/(auth)/WelcomeScreen';
import AuthScreen from '../app/(auth)/AuthScreen';
import LoginScreen from '../app/(auth)/LoginScreen';
import SignupScreen from '../app/(auth)/SignupScreen';
import OTPScreen from '../app/(auth)/OTPScreen';

// Import dashboard screens
import HomeScreen from '../app/(dashboard)/HomeScreen';
import WelcomeUserScreen from '../app/(dashboard)/WelcomeUserScreen';
import ServicesScreen from '../app/(dashboard)/ServicesScreen';
import ProfileScreen from '../app/(dashboard)/ProfileScreen';
import EditProfileScreen from '../app/(dashboard)/EditProfileScreen';
import WalletScreen from '../app/(dashboard)/WalletScreen';
import AddMoneyScreen from '../app/(dashboard)/AddMoneyScreen';
import MerchantDetailScreen from '../app/(dashboard)/MerchantDetailScreen';
import PaymentScreen from '../app/(dashboard)/PaymentScreen';
import TxnSuccessScreen from '../app/(dashboard)/TxnSuccessScreen';
import PinVerifyScreen from '../app/(dashboard)/PinVerifyScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await isUserLoggedIn();
      setInitialRoute(isLoggedIn ? 'HomeScreen' : 'Welcome');
    } catch (error) {
      console.error('Error checking login status:', error);
      setInitialRoute('Welcome');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animationEnabled: false,
          cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 0 } },
            close: { animation: 'timing', config: { duration: 0 } },
          },
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="OTPScreen" component={OTPScreen} options={{ animationEnabled: false }} />

        {/* Dashboard Stack */}
        <Stack.Screen name="WelcomeUserScreen" component={WelcomeUserScreen} options={{ gestureEnabled: false, animationEnabled: false }} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ gestureEnabled: false, animationEnabled: false }} />
        <Stack.Screen name="ServicesScreen" component={ServicesScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="WalletScreen" component={WalletScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="AddMoneyScreen" component={AddMoneyScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="MerchantDetailScreen" component={MerchantDetailScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="TxnSuccessScreen" component={TxnSuccessScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="PinVerifyScreen" component={PinVerifyScreen} options={{ animationEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 