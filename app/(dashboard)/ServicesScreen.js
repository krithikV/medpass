import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import images from '../../assets/images';
import SideNavigation from '../../components/SideNavigation';
import BottomNavigation from '../../components/BottomNavigation';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0065fb',
  primary100: '#dae9ff',
  primary1000: '#002965',
  secondary800: '#01a1a6',
  text: '#3a3a3a',
  white: '#ffffff',
  chipText: '#0065fb',
  underline: '#01a1a6',
  open: '#4CAF50',
  closed: '#F44336',
};

export default function ServicesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  // Fixed logo base URL (ignore API-provided base URL)
  const LOGO_BASE_URL = 'https://mediimpact.in/assets/img/logo/';

  // Get service id from route params, default to 3 (Clinic)
  const serviceIdParam = route?.params?.serviceId;
  const serviceId = typeof serviceIdParam === 'number' ? serviceIdParam : Number(serviceIdParam) || 3;
  
  // Memoize serviceConfig to prevent re-creation on every render
  const serviceConfig = useMemo(() => {
    const configsById = {
      1: {
        title: 'Lab',
        breadcrumb: 'Home > Lab',
        sectionTitle: 'Labs',
        placeholder: 'Search labs...',
        data: [],
      },
      2: {
        title: 'Hospital',
        breadcrumb: 'Home > Hospital',
        sectionTitle: 'Hospitals',
        placeholder: 'Search hospitals...',
        data: [],
      },
      3: {
        title: 'Clinic',
        breadcrumb: 'Home > Clinic',
        sectionTitle: 'Clinics',
        placeholder: 'Search clinics...',
        data: [],
      },
      4: {
        title: 'Pharmacy',
        breadcrumb: 'Home > Pharmacy',
        sectionTitle: 'Pharmacies',
        placeholder: 'Search pharmacies...',
        data: [],
      },
      5: {
        title: 'Homecare Services',
        breadcrumb: 'Home > Homecare Services',
        sectionTitle: 'Homecare Providers',
        placeholder: 'Search homecare services...',
        data: [],
      },
      6: {
        title: 'Ambulance Services',
        breadcrumb: 'Home > Ambulance Services',
        sectionTitle: 'Ambulance Services',
        placeholder: 'Search ambulance services...',
        data: [],
      },
      7: {
        title: 'Medical Devices',
        breadcrumb: 'Home > Medical Devices',
        sectionTitle: 'Medical Device Stores',
        placeholder: 'Search medical devices...',
        data: [],
      },
      8: {
        title: 'Doctor to Door',
        breadcrumb: 'Home > Doctor to Door',
        sectionTitle: 'Doctor to Door',
        placeholder: 'Search doctor to door...',
        data: [],
      },
      9: {
        title: 'IVF',
        breadcrumb: 'Home > IVF',
        sectionTitle: 'IVF Centers',
        placeholder: 'Search IVF centers...',
        data: [],
      },
    };
    return configsById[serviceId] || configsById[3];
  }, [serviceId]); // Only re-create when serviceId changes

  useEffect(() => {
    const fetchMerchants = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        let latitude = null;
        let longitude = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
          }
        } catch (_) {
          // ignore location errors, fallback to default coords
        }

        if (latitude == null || longitude == null) {
          // Fallback sample coordinates to still show data
          latitude = 11.587825;
          longitude = 76.026344;
        }

        const url = `https://api.mediimpact.in/index.php/user/get_merchants?id=${serviceId}&lat=${latitude}&lng=${longitude}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = await res.json();
        const data = Array.isArray(json?.merchant_data) ? json.merchant_data : [];
        setMerchants(data);
      } catch (err) {
        setErrorMessage('Unable to load services at the moment.');
        setMerchants([]); // Ensure merchants is empty on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchants();
  }, [serviceId]);

  // Initialize filteredData when merchants change or component loads
  useEffect(() => {
    const baseData = Array.isArray(merchants) ? merchants : [];
    const mappedData = baseData.map((m) => ({
      id: m.id,
      name: m.provider_display_name || m.name,
      phone: m.phone_no || m.notification_mobile || m.merchant_mobile || m.phone || '',
      address: m.address || '',
      rating: (typeof m.kms === 'number' ? `${m.kms.toFixed(1)} km` : (m.kms ? `${Number(m.kms).toFixed(1)} km` : null)) || m.rating || null,
      waitTime: m.max_discount ? `${m.max_discount}% Off` : m.waitTime || null,
      category: serviceConfig.title,
      image: m.logo ? { uri: `${LOGO_BASE_URL}${m.logo}` } : m.image || images.clinicImage19,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      longitude: m.longitude ? Number(m.longitude) : undefined,
      logoFileName: m.logo || null,
      kmsRaw: typeof m.kms === 'number' ? m.kms : (m.kms ? Number(m.kms) : null),
      maxDiscount: m.max_discount ? Number(m.max_discount) : null,
      website: m.merchant_website || m.website || '',
    }));
    setFilteredData(mappedData);
  }, [merchants, serviceConfig]);

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Reset to show all data when search is cleared
      const baseData = Array.isArray(merchants) ? merchants : [];
      const mappedData = baseData.map((m) => ({
        id: m.id,
        name: m.provider_display_name || m.name,
        phone: m.phone_no || m.notification_mobile || m.merchant_mobile || m.phone || '',
        address: m.address || '',
        rating: (typeof m.kms === 'number' ? `${m.kms.toFixed(1)} km` : (m.kms ? `${Number(m.kms).toFixed(1)} km` : null)) || m.rating || null,
        waitTime: m.max_discount ? `${m.max_discount}% Off` : m.waitTime || null,
        category: serviceConfig.title,
        image: m.logo ? { uri: `${LOGO_BASE_URL}${m.logo}` } : m.image || images.clinicImage19,
        latitude: m.latitude ? Number(m.latitude) : undefined,
        longitude: m.longitude ? Number(m.longitude) : undefined,
        logoFileName: m.logo || null,
        kmsRaw: typeof m.kms === 'number' ? m.kms : (m.kms ? Number(m.kms) : null),
        maxDiscount: m.max_discount ? Number(m.max_discount) : null,
        website: m.merchant_website || m.website || '',
      }));
      setFilteredData(mappedData);
      return;
    }

    // Filter existing mapped data
    const query = searchQuery.toLowerCase().trim();
    const currentData = Array.isArray(merchants) ? merchants : [];
    const mappedData = currentData.map((m) => ({
      id: m.id,
      name: m.provider_display_name || m.name,
      phone: m.phone_no || m.notification_mobile || m.merchant_mobile || m.phone || '',
      address: m.address || '',
      rating: (typeof m.kms === 'number' ? `${m.kms.toFixed(1)} km` : (m.kms ? `${Number(m.kms).toFixed(1)} km` : null)) || m.rating || null,
      waitTime: m.max_discount ? `${m.max_discount}% Off` : m.waitTime || null,
      category: serviceConfig.title,
      image: m.logo ? { uri: `${LOGO_BASE_URL}${m.logo}` } : m.image || images.clinicImage19,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      longitude: m.longitude ? Number(m.longitude) : undefined,
      logoFileName: m.logo || null,
      kmsRaw: typeof m.kms === 'number' ? m.kms : (m.kms ? Number(m.kms) : null),
      maxDiscount: m.max_discount ? Number(m.max_discount) : null,
      website: m.merchant_website || m.website || '',
    }))
    .filter((m) => {
      const nameMatch = (m.name || '').toLowerCase().includes(query);
      const categoryMatch = (m.category || '').toLowerCase().includes(query);
      const addressMatch = (m.address || '').toLowerCase().includes(query);
      const phoneMatch = (m.phone || '').toLowerCase().includes(query);
      return nameMatch || categoryMatch || addressMatch || phoneMatch;
    })
    .sort((a, b) => {
      const aKms = typeof a.kmsRaw === 'number' ? a.kmsRaw : Number.MAX_SAFE_INTEGER;
      const bKms = typeof b.kmsRaw === 'number' ? b.kmsRaw : Number.MAX_SAFE_INTEGER;
      return aKms - bKms;
    });

    setFilteredData(mappedData);
  }, [searchQuery, merchants, serviceConfig]);

  const openMaps = (item) => {
    const label = encodeURIComponent(item.name || 'Destination');
    const hasCoords =
      typeof item.latitude === 'number' && isFinite(item.latitude) &&
      typeof item.longitude === 'number' && isFinite(item.longitude);

    if (hasCoords) {
      const latLng = `${item.latitude},${item.longitude}`;
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${label}&ll=${latLng}`,
        android: `geo:0,0?q=${latLng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
      });
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`).catch(() => {});
      });
    } else {
      const query = encodeURIComponent(`${item.name || ''} ${item.address || ''}`.trim());
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
      });
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
      });
    }
  };

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) return;
    const url = Platform.select({
      ios: `tel://${phoneNumber}`,
      android: `tel:${phoneNumber}`,
      default: `tel:${phoneNumber}`,
    });
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to make call:', err);
      Alert.alert('Error', 'Could not make call. Please try again.');
    }
  };

  const openWebsite = (website) => {
    if (!website) return;
    let url = String(website).trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    Linking.openURL(url).catch(() => {});
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

  const handleLogout = () => {
    // Navigate to auth screen (the main auth screen with login/signup options)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const handleTabPress = (tabId) => {
    switch (tabId) {
      case 'home':
        navigation.replace('HomeScreen');
        break;
      case 'wallet':
        navigation.replace('WalletScreen');
        break;
      case 'profile':
        navigation.replace('ProfileScreen');
        break;
      default:
        break;
    }
  };

  const renderChip = (label) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );

  const renderItem = ({ item: c }) => (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={styles.cardOuter}>
        {/* Left image with Maps button */}
        <View style={styles.cardLeft}>
          <Image source={c.image} style={styles.cardImage} resizeMode="contain" />
          {c.latitude && c.longitude && (
            <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(c)}>
              <Text style={styles.mapsBtnText}>Maps</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(c.phone)}>
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Right white content - tap to open details */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cardRight}
          onPress={() => navigation.navigate('MerchantDetailScreen', { merchantId: c.id, prefill: c })}
        >
          <Text style={styles.cardTitle}>{c.name}</Text>
          {!!c.address && <Text style={styles.cardAddress}>{c.address}</Text>}
          {!!c.website && (
            <TouchableOpacity onPress={() => openWebsite(c.website)}>
              <Text style={styles.websiteLink} numberOfLines={1}>
                {String(c.website).replace(/^https?:\/\//i, '')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Phone as clickable link */}
          {!!c.phone && (
            <TouchableOpacity style={styles.rowCenter} onPress={() => Linking.openURL(Platform.select({ ios: `tel://${c.phone}`, android: `tel:${c.phone}`, default: `tel:${c.phone}` }))}>
              <Ionicons name="call" size={13} color={COLORS.primary1000} />
              <Text style={[styles.phoneText, styles.contactLink]}>{c.phone}</Text>
            </TouchableOpacity>
          )}

          {/* Chips + trailing icon */}
          <View style={styles.rowBetween}>
            <View style={styles.rowChips}>
              {c.rating ? renderChip(c.rating) : null}
              {c.waitTime ? renderChip(c.waitTime) : null}
              {c.category ? renderChip(c.category) : null}
            </View>
          </View>

        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary100 }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
      {/* TOP area (above safe area) */}
      <View style={{ height: insets.top, backgroundColor: COLORS.primary100 }} />
      <View style={styles.container}>
        {/* Static Banner/Header */}
        <View style={styles.banner}>
          {/* Top row: pill back + title */}
          <View style={styles.bannerTopRow}>
            <TouchableOpacity style={styles.pillBack} onPress={() => navigation.goBack()}>
              <View style={styles.pillBackInner}>
                <Ionicons name="arrow-back" size={18} color="#3a3a3a" />
              </View>
            </TouchableOpacity>
            <Text style={styles.bannerTitle}>{serviceConfig.title}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search row (static) */}
          <View style={styles.searchRow}>
            <TouchableOpacity style={styles.menuBox} onPress={toggleSideNav}>
              <Ionicons name="menu" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={serviceConfig.placeholder}
                placeholderTextColor="#9AA0A6"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Breadcrumb */}
          <Text style={styles.breadcrumb}>{serviceConfig.breadcrumb}</Text>
        </View>

        {/* Static Section title + underline */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{serviceConfig.sectionTitle}</Text>
          <View style={styles.underline} />
        </View>

        {/* Scrollable list only */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              const hasMerchants = Array.isArray(merchants) && merchants.length > 0;
              const showSearchEmpty = hasMerchants && searchQuery.trim();
              return (
                <View style={{ paddingVertical: 40, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 16 }}>
                    {hasMerchants
                      ? (showSearchEmpty ? `No results found for "${searchQuery}"` : 'No results')
                      : 'No services available'}
                  </Text>
                  {showSearchEmpty ? (
                    <Text style={{ color: '#999', fontSize: 14, marginTop: 8 }}>Try adjusting your search terms</Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}
        {!!errorMessage && (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{errorMessage}</Text>
        )}
      </View>
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" onTabPress={handleTabPress} bottomOffset={28} />
      
      {/* Side Navigation */}
      {isSideNavOpen && (
        <SideNavigation
          isOpen={isSideNavOpen}
          onClose={toggleSideNav}
          onLogout={handleLogout}
          slideAnim={slideAnim}
          fadeAnim={fadeAnim}
          navigation={navigation}
        />
      )}
      {/* BOTTOM area (below safe area) */}
      <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary100,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  banner: {
    backgroundColor: COLORS.primary100,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  pillBackInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    columnGap: 8,
  },
  menuBox: {
    width: 37,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
  },
  addMoneyBtn: {
    backgroundColor: COLORS.secondary800,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoneyText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  breadcrumb: {
    marginTop: 16,
    color: 'rgba(34,31,31,0.56)',
    fontSize: 12,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#000',
    marginBottom: 6,
  },
  underline: {
    height: 2,
    width: width - 32,
    backgroundColor: COLORS.underline,
  },
  cardOuter: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3EEFF',
  },
  cardLeft: {
    width: 97,
  },
  cardImage: {
    width: 97,
    height: 84,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  mapsBtn: {
    backgroundColor: COLORS.primary,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  mapsBtnText: {
    color: '#FAFAFA',
    fontSize: 14,
  },
  callBtn: {
    backgroundColor: COLORS.secondary800,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  callBtnText: {
    color: '#FAFAFA',
    fontSize: 14,
  },
  cardRight: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    color: COLORS.primary1000,
    fontSize: 16,
    fontWeight: '700',
  },
  cardAddress: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 12,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phoneText: {
    color: COLORS.primary1000,
    fontSize: 10,
    marginLeft: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.primary100,
    borderRadius: 10,
    height: 21,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: COLORS.chipText,
    fontSize: 10,
  },
  websiteLink: {
    marginTop: 6,
    color: '#0A4C9A',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  contactLink: {
    marginTop: 4,
    color: '#0A4C9A',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});


