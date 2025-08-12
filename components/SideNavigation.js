import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  Linking,
  Share 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getUserData, clearUserData } from '../utils/userStorage';
import LogoutPopup from './LogoutPopup';

const { width } = Dimensions.get('window');

export default function SideNavigation({ isOpen, onClose, slideAnim, fadeAnim, onLogout, navigation }) {
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [userData, setUserData] = useState({
    userName: '',
    userMobile: '',
    userBalance: '0',
    walletStatus: '0'
  });

  useEffect(() => {
    // Fetch user data when component mounts or when side navigation opens
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      if (data) {
        setUserData({
          userName: data.userName || 'User',
          userMobile: data.userMobile ? `+91 ${data.userMobile}` : '',
          userBalance: data.userBalance || '0',
          walletStatus: data.walletStatus || '0'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogoutPress = () => {
    setShowLogoutPopup(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutPopup(false);
  };

  const handleConfirmLogout = async () => {
    try {
      // Clear user data from storage
      await clearUserData();
      console.log('User data cleared on logout');
      
      // Reset local state
      setUserData({
        userName: '',
        userMobile: '',
        userBalance: '0',
        walletStatus: '0'
      });
      
      setShowLogoutPopup(false);
      onClose(); // Close the side navigation
      
      if (onLogout) {
        onLogout(); // Navigate to signin screen
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Still proceed with logout even if clearing data fails
      setShowLogoutPopup(false);
      onClose();
      if (onLogout) {
        onLogout();
      }
    }
  };

  const handleShareInvite = async () => {
    try {
      onClose();
      await Share.share({
        message:
          "Hi, I am inviting you to use Medpass Application, India’s only Health digital wallet app. Save money on each transaction, and get up to 25%cashback on all your Health services expenses. https://play.google.com/store/apps/details?id=com.ksm.medpass",
        title: 'Invite to Medpass',
      });
    } catch (e) {
      // no-op
    }
  };

  return (
    <>
      <View style={styles.sideNavOverlay}>
        <TouchableOpacity 
          style={styles.sideNavBackdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.sideNav,
            {
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          {/* Header with Profile and Close Button */}
          <View style={styles.sideNavHeader}>
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Ionicons name="person-circle" size={56} color="#007bff" />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userData.userName}</Text>
                <Text style={styles.profilePhone}>{userData.userMobile}</Text>
                <TouchableOpacity 
                  style={styles.profileLink}
                  onPress={() => {
                    onClose(); // Close side navigation
                    if (navigation) {
                      navigation.navigate('ProfileScreen');
                    }
                  }}
                >
                  <Text style={styles.profileLinkText}>Profile</Text>
                  <Ionicons name="chevron-forward" size={14} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Rupees Box */}
          <View style={styles.rupeesBox}>
            <Text style={styles.rupeesAmount}>₹{userData.userBalance}</Text>
          </View>

          {/* Total Money Saved */}
          <View style={styles.totalMoneySavedContainer}>
            <Text 
              style={styles.totalMoneySavedText}
              onPress={() => {
                onClose();
                navigation && navigation.navigate('WalletScreen');
              }}
            >
              Total money saved
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#00388a" style={styles.totalMoneySavedArrow} />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Navigation Menu */}
          <View style={styles.navMenu}>
            {/* Wallet */}
            <TouchableOpacity 
              style={styles.navMenuItem}
              onPress={() => {
                onClose();
                navigation && navigation.navigate('WalletScreen');
              }}
            >
              <View style={styles.navMenuItemLeft}>
                <MaterialIcons name="account-balance-wallet" size={16} color="#007bff" style={styles.navIcon} />
                <Text style={styles.navMenuItemTitle}>Wallet</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6c757d" />
            </TouchableOpacity>

            {/* Prescription */}
            <TouchableOpacity 
              style={styles.navMenuItem}
              onPress={async () => {
                try {
                  onClose();
                  await Share.share({ message: 'Hi this is a client from Medpass' });
                } catch (_) {}
              }}
            >
              <View style={styles.navMenuItemLeft}>
                <MaterialIcons name="description" size={16} color="#007bff" style={styles.navIcon} />
                <Text style={styles.navMenuItemTitle}>Prescription</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6c757d" />
            </TouchableOpacity>

            {/* Subscribe */}
            <TouchableOpacity 
              style={styles.navMenuItem}
              onPress={() => {
                onClose();
                Linking.openURL('https://www.youtube.com/@medpass1369').catch(() => {});
              }}
            >
              <View style={styles.navMenuItemLeft}>
                <Ionicons name="logo-youtube" size={16} color="#FF0000" style={styles.navIcon} />
                <Text style={styles.navMenuItemTitle}>Subscribe</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6c757d" />
            </TouchableOpacity>

            {/* Customer Policy */}
            <TouchableOpacity style={styles.navMenuItem} onPress={() => Linking.openURL('https://medi-impact.com/customer-protection-policy/')}>
              <View style={styles.navMenuItemLeft}>
                <MaterialIcons name="description" size={16} color="#007bff" style={styles.navIcon} />
                <Text style={styles.navMenuItemTitle}>Customer Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6c757d" />
            </TouchableOpacity>

            {/* Grievance Policy */}
            <TouchableOpacity style={styles.navMenuItem} onPress={() => Linking.openURL('https://medi-impact.com/grievance-redressal-policy/')}>
              <View style={styles.navMenuItemLeft}>
                <MaterialIcons name="policy" size={16} color="#007bff" style={styles.navIcon} />
                <Text style={styles.navMenuItemTitle}>Grievance Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6c757d" />
            </TouchableOpacity>

            {/* Refer a friend */}
            <TouchableOpacity style={styles.navMenuItem} onPress={handleShareInvite}>
              <View style={styles.navMenuItemLeft}>
                <Ionicons name="people" size={16} color="#007bff" style={styles.navIcon} />
                <Text style={styles.navMenuItemTitle}>Refer a friend</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6c757d" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
            <Text style={styles.logoutText}>Log out</Text>
            <MaterialIcons name="logout" size={20} color="#0065fb" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Logout Popup */}
      <LogoutPopup
        visible={showLogoutPopup}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sideNavOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sideNavBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sideNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingHorizontal: 16,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sideNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#3a3a3a',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  profilePhone: {
    fontSize: 13,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#3a3a3a',
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  profileLinkText: {
    fontSize: 13,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#007bff',
    marginRight: 6,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rupeesBox: {
    paddingHorizontal: 12,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  rupeesAmount: {
    fontSize: 24,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#000000',
  },
  totalMoneySavedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  totalMoneySavedText: {
    fontSize: 13,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#00388a',
    marginRight: 6,
    textDecorationLine: 'underline',
  },
  totalMoneySavedArrow: {
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 10,
  },
  navMenu: {
    flex: 1,
  },
  navMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  navMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    marginRight: 12,
  },
  navMenuItemText: {
    flex: 1,
  },
  navMenuItemTitle: {
    fontSize: 16,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '500',
    color: '#3a3a3a',
  },
  navMenuItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Satoshi',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#969696',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0065fb',
    marginBottom: 16,
    marginHorizontal: 12,
    marginTop: 2,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#0065fb',
    textAlign: 'center',
  },
});
