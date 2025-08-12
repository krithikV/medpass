import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  Dimensions,
  Animated,
  Alert,
  StatusBar,
  Modal,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import images from '../../assets/images';
import SideNavigation from '../../components/SideNavigation';
import BottomNavigation from '../../components/BottomNavigation';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isInsuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Request location permission when component mounts
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Permission denied, but don't show any UI - just log it
        console.log('Location permission denied');
      } else {
        // Permission granted, now get current location
        console.log('Location permission granted');
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          });
          
          const { latitude, longitude } = location.coords;
          console.log('Current Location:', {
            latitude: latitude,
            longitude: longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toISOString()
          });
        } catch (locationError) {
          console.log('Error getting current location:', locationError);
        }
      }
    } catch (error) {
      console.log('Error requesting location permission:', error);
    }
  };

  const toggleSideNav = () => {
    if (isSideNavOpen) {
      // Close animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsSideNavOpen(false);
      });
    } else {
      // Open animation
      setIsSideNavOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const handleTabPress = async (tabId) => {
    switch (tabId) {
      case 'home':
        // Already on home screen
        break;
      case 'wallet': {
        try {
          const user = await require('../../utils/userStorage').getUserData();
          const firstName = user?.userData?.first_name || user?.userData?.firstname || user?.userName;
          if (!firstName || String(firstName).trim().length === 0) {
            navigation.replace('EditProfileScreen');
          } else {
            navigation.replace('WalletScreen');
          }
        } catch (_) {
          navigation.replace('WalletScreen');
        }
        break;
      }
      case 'profile':
        navigation.replace('ProfileScreen');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    // Navigate to auth screen (the main auth screen with login/signup options)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const openInsuranceModal = () => setInsuranceModalVisible(true);
  const closeInsuranceModal = () => setInsuranceModalVisible(false);
  const callInsurance = () => {
    closeInsuranceModal();
    Linking.openURL('tel:+919008989857').catch(() => {});
  };
  const emailInsurance = () => {
    closeInsuranceModal();
    Linking.openURL('mailto:support@medi-impact.com').catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#dae9ff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#dae9ff" />

      {/* TOP area (above safe area) */}
      <View style={{ height: insets.top, backgroundColor: '#dae9ff' }} />

      {/* SAFE area/content */}
      <View style={styles.pageRoot}>
        {/* Side Navigation */}
        {isSideNavOpen && (
          <SideNavigation
            isOpen={isSideNavOpen}
            onClose={toggleSideNav}
            slideAnim={slideAnim}
            fadeAnim={fadeAnim}
            onLogout={handleLogout}
            navigation={navigation}
          />
        )}

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.appName}>Medpass</Text>
            </View>
          </View>
          
          {/* Search and Add Money */}
          <View style={styles.searchContainer}>
            <View style={styles.searchSection}>
              <TouchableOpacity style={styles.menuButton} onPress={toggleSideNav}>
                <Ionicons name="menu" size={16} color="#3a3a3a" />
              </TouchableOpacity>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={16} color="#3a3a3a" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search here"
                  placeholderTextColor="#3a3a3a"
                  onFocus={() => navigation.navigate('AllServicesScreen')}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.addMoneyButton} onPress={() => navigation.navigate('AddMoneyScreen')}>
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Services Section */}
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Services</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.serviceGrid}>
              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 1 })}>
                <Image source={images.laboratoryIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Lab</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 2 })}>
                <Image source={images.hospitalIconNew} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Hospital</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 3 })}>
                <Image source={images.clinicIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Clinic</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 4 })}>
                <Image source={images.pharmacyIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Pharmacy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 5 })}>
                <Image source={images.homeCareIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Homecare</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 6 })}>
                <Image source={images.ambulanceIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Ambulance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 7 })}>
                <Image source={images.medicalDevicesIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Medical Devices</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 8 })}>
                <Image source={images.healthCareIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Doctor to Door</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServicesScreen', { serviceId: 9 })}>
                <Image source={images.ivfIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>IVF</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceCard} onPress={openInsuranceModal}>
                <Image source={images.insuranceIcon} style={styles.serviceIcon} resizeMode="contain" />
                <Text style={styles.serviceText}>Insurance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab="home"
          onTabPress={handleTabPress}
          beforeWalletPress={async () => {
            try {
              const { needsFirstName } = require('../../utils/userStorage');
              const shouldRedirect = await needsFirstName();
              if (shouldRedirect) {
                navigation.replace('EditProfileScreen');
                return true; // stop default onTabPress
              }
              return false;
            } catch (_) {
              return false;
            }
          }}
          beforeProfilePress={async () => {
            try {
              const { needsFirstName } = require('../../utils/userStorage');
              const shouldRedirect = await needsFirstName();
              if (shouldRedirect) {
                navigation.replace('EditProfileScreen');
                return true;
              }
              return false;
            } catch (_) {
              return false;
            }
          }}
        />

        {/* Insurance Modal */}
        <Modal visible={isInsuranceModalVisible} transparent animationType="fade" onRequestClose={closeInsuranceModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Insurance</Text>
              <Text style={styles.modalSubtitle}>Choose an option</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={callInsurance}>
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.modalBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtn} onPress={emailInsurance}>
                  <Ionicons name="mail" size={18} color="#fff" />
                  <Text style={styles.modalBtnText}>Email</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={closeInsuranceModal}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* BOTTOM area (below safe area) */}
      <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#dae9ff',
  },
  pageRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#dae9ff',
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 48,
    height: 36,
    marginRight: 9,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Satoshi',
    fontWeight: '500',
    color: '#017f83',
    letterSpacing: -2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    backgroundColor: '#ffffff',
    width: 37,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  searchInputContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    height: 36,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#3a3a3a',
    fontFamily: 'Satoshi Variable',
  },
  addMoneyButton: {
    backgroundColor: '#01a1a6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  addMoneyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  servicesSection: {
    marginTop: 30,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a3a3a',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    width: (width - 52) / 2,
    height: 165,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    shadowColor: '#0c0c0d',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  serviceIcon: {
    width: 103,
    height: 103,
    marginBottom: 16,
  },
  serviceText: {
    fontSize: 18,
    fontFamily: 'Satoshi Variable',
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 21.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: width - 64,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    backgroundColor: '#01a1a6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalClose: {
    marginTop: 12,
  },
  modalCloseText: {
    color: '#0065fb',
    fontWeight: '600',
  },
}); 