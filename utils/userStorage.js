import AsyncStorage from '@react-native-async-storage/async-storage';

// User data storage keys
export const USER_STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_ID: 'userId',
  USER_NAME: 'userName',
  USER_MOBILE: 'userMobile',
  USER_DATA: 'userData',
  WALLET_STATUS: 'walletStatus',
  USER_BALANCE: 'userBalance',
  BA_CODE: 'baCode',
  IS_LOGGED_IN: 'isLoggedIn',
};

const sanitizeToString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
};

const API_BASE = 'https://api.mediimpact.in/index.php';

// Store user data after successful login
export const storeUserData = async (userData, phoneNumber) => {
  try {
    const dataToStore = {
      [USER_STORAGE_KEYS.USER_TOKEN]: sanitizeToString(userData?.token),
      [USER_STORAGE_KEYS.USER_ID]: sanitizeToString(userData?.userId),
      [USER_STORAGE_KEYS.USER_NAME]: sanitizeToString(userData?.name),
      [USER_STORAGE_KEYS.USER_MOBILE]: sanitizeToString(phoneNumber),
      [USER_STORAGE_KEYS.USER_DATA]: JSON.stringify(userData?.user_data ?? {}),
      [USER_STORAGE_KEYS.WALLET_STATUS]: sanitizeToString(userData?.wallets_status),
      [USER_STORAGE_KEYS.USER_BALANCE]: sanitizeToString(userData?.balance),
      [USER_STORAGE_KEYS.BA_CODE]: sanitizeToString(userData?.ba_code),
      [USER_STORAGE_KEYS.IS_LOGGED_IN]: 'true',
    };

    // Store all data as strings
    await Promise.all(
      Object.entries(dataToStore).map(([key, value]) =>
        AsyncStorage.setItem(key, value)
      )
    );

    console.log('User data stored successfully');
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

// Refresh user data from API using stored token and userId
export const refreshUserDataFromAPI = async () => {
  try {
    const [token, userId] = await Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_TOKEN),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_ID),
    ]);

    if (!token || !userId) {
      console.warn('refreshUserDataFromAPI: missing token or userId');
      return { ok: false, reason: 'missing-credentials' };
    }

    const resp = await fetch(`${API_BASE}/User/User_Info_new`, {
      method: 'GET',
      headers: {
        token: token,
        'User-ID': userId,
      },
    });

    const data = await resp.json();

    if (!resp.ok || data?.status !== 200) {
      console.warn('refreshUserDataFromAPI: non-200', data);
      return { ok: false, reason: 'bad-status', data };
    }

    const updated = {
      [USER_STORAGE_KEYS.USER_ID]: sanitizeToString(data.userId),
      [USER_STORAGE_KEYS.USER_NAME]: sanitizeToString(data.name),
      [USER_STORAGE_KEYS.USER_DATA]: JSON.stringify(data.user_data ?? {}),
      [USER_STORAGE_KEYS.WALLET_STATUS]: sanitizeToString(data.wallets_status),
      [USER_STORAGE_KEYS.USER_BALANCE]: sanitizeToString(data.balance),
      [USER_STORAGE_KEYS.BA_CODE]: sanitizeToString(data.ba_code),
    };

    await Promise.all(
      Object.entries(updated).map(([k, v]) => AsyncStorage.setItem(k, v))
    );

    return { ok: true, data };
  } catch (error) {
    console.error('refreshUserDataFromAPI error:', error);
    return { ok: false, reason: 'exception', error };
  }
};

// Get user data
export const getUserData = async () => {
  try {
    const userData = {};
    
    // Get all stored user data
    const [
      token,
      userId,
      userName,
      userMobile,
      userDataString,
      walletStatus,
      userBalance,
      baCode,
      isLoggedIn
    ] = await Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_TOKEN),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_ID),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_NAME),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_MOBILE),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_DATA),
      AsyncStorage.getItem(USER_STORAGE_KEYS.WALLET_STATUS),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_BALANCE),
      AsyncStorage.getItem(USER_STORAGE_KEYS.BA_CODE),
      AsyncStorage.getItem(USER_STORAGE_KEYS.IS_LOGGED_IN),
    ]);

    return {
      token,
      userId,
      userName,
      userMobile,
      userData: userDataString ? JSON.parse(userDataString) : null,
      walletStatus,
      userBalance,
      baCode,
      isLoggedIn: isLoggedIn === 'true',
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Check if user is logged in
export const isUserLoggedIn = async () => {
  try {
    const isLoggedIn = await AsyncStorage.getItem(USER_STORAGE_KEYS.IS_LOGGED_IN);
    return isLoggedIn === 'true';
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

// Clear user data (logout)
export const clearUserData = async () => {
  try {
    await Promise.all(
      Object.values(USER_STORAGE_KEYS).map(key => 
        AsyncStorage.removeItem(key)
      )
    );
    console.log('User data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

// Get specific user data field
export const getUserField = async (fieldKey) => {
  try {
    return await AsyncStorage.getItem(fieldKey);
  } catch (error) {
    console.error(`Error getting user field ${fieldKey}:`, error);
    return null;
  }
};

// Fetch wallet status from dedicated API (do not rely on user_info)
export const fetchWalletStatus = async () => {
  try {
    const [token, userId, mobile] = await Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_TOKEN),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_ID),
      AsyncStorage.getItem(USER_STORAGE_KEYS.USER_MOBILE),
    ]);

    if (!token || !userId || !mobile) {
      return { ok: false, reason: 'missing-credentials' };
    }

    const body = new URLSearchParams();
    body.append('mobile', mobile);

    const resp = await fetch(`${API_BASE}/Wallet/MobileValidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        token,
        'User-ID': userId,
        version: '10007',
      },
      body: body.toString(),
    });

    const data = await resp.json();
    if (!resp.ok || data?.status !== 200) {
      return { ok: false, reason: 'bad-status', data };
    }

    return { ok: true, walletStatus: String(data.wallet_status) };
  } catch (error) {
    console.error('fetchWalletStatus error:', error);
    return { ok: false, reason: 'exception', error };
  }
};
