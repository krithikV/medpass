import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import images from '../../assets/images';
import SideNavigation from '../../components/SideNavigation';
import BottomNavigation from '../../components/BottomNavigation';

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
};

export default function AllServicesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const LOGO_BASE_URL = 'https://mediimpact.in/assets/img/logo/';

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
        } catch (_) {}
        if (latitude == null || longitude == null) {
          latitude = 11.587825;
          longitude = 76.026344;
        }
        const url = `http://api.mediimpact.in/index.php/user/get_merchants?lat=${latitude}&lng=${longitude}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const data = Array.isArray(json?.merchant_data) ? json.merchant_data : [];
        setMerchants(data);
      } catch (err) {
        setErrorMessage('Unable to load services at the moment.');
        setMerchants([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMerchants();
  }, []);

  // Normalize list
  useEffect(() => {
    const baseData = Array.isArray(merchants) ? merchants : [];
    const mappedData = baseData.map((m) => ({
      id: m.id,
      name: m.provider_display_name || m.name,
      phone: m.phone_no || m.notification_mobile || m.merchant_mobile || m.phone || '',
      address: m.address || '',
      rating: (typeof m.kms === 'number' ? `${m.kms.toFixed(1)} km` : (m.kms ? `${Number(m.kms).toFixed(1)} km` : null)) || null,
      waitTime: m.max_discount ? `${m.max_discount}% Off` : null,
      category: m.med_type ? String(m.med_type) : '',
      image: m.logo ? { uri: `${LOGO_BASE_URL}${m.logo}` } : images.clinicImage19,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      longitude: m.longitude ? Number(m.longitude) : undefined,
      logoFileName: m.logo || null,
      kmsRaw: typeof m.kms === 'number' ? m.kms : (m.kms ? Number(m.kms) : null),
      maxDiscount: m.max_discount ? Number(m.max_discount) : null,
      website: m.merchant_website || m.website || '',
    }));
    setFilteredData(mappedData);
  }, [merchants]);

  // Search filter
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    const currentData = Array.isArray(merchants) ? merchants : [];
    const mappedData = currentData.map((m) => ({
      id: m.id,
      name: m.provider_display_name || m.name,
      phone: m.phone_no || m.notification_mobile || m.merchant_mobile || m.phone || '',
      address: m.address || '',
      rating: (typeof m.kms === 'number' ? `${m.kms.toFixed(1)} km` : (m.kms ? `${Number(m.kms).toFixed(1)} km` : null)) || null,
      waitTime: m.max_discount ? `${m.max_discount}% Off` : null,
      category: m.med_type ? String(m.med_type) : '',
      image: m.logo ? { uri: `${LOGO_BASE_URL}${m.logo}` } : images.clinicImage19,
      latitude: m.latitude ? Number(m.latitude) : undefined,
      longitude: m.longitude ? Number(m.longitude) : undefined,
      logoFileName: m.logo || null,
      kmsRaw: typeof m.kms === 'number' ? m.kms : (m.kms ? Number(m.kms) : null),
      maxDiscount: m.max_discount ? Number(m.max_discount) : null,
      website: m.merchant_website || m.website || '',
    }))
      .filter((m) => {
        if (!query) return true;
        const nameMatch = (m.name || '').toLowerCase().includes(query);
        const addressMatch = (m.address || '').toLowerCase().includes(query);
        const phoneMatch = (m.phone || '').toLowerCase().includes(query);
        return nameMatch || addressMatch || phoneMatch;
      })
      .sort((a, b) => {
        const aKms = typeof a.kmsRaw === 'number' ? a.kmsRaw : Number.MAX_SAFE_INTEGER;
        const bKms = typeof b.kmsRaw === 'number' ? b.kmsRaw : Number.MAX_SAFE_INTEGER;
        return aKms - bKms;
      });
    setFilteredData(mappedData);
  }, [searchQuery, merchants]);

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
      Linking.openURL(url).catch(() => {});
    } else {
      const query = encodeURIComponent(`${item.name || ''} ${item.address || ''}`.trim());
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
      });
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) return;
    const url = Platform.select({ ios: `tel://${phoneNumber}`, android: `tel:${phoneNumber}`, default: `tel:${phoneNumber}` });
    try { await Linking.openURL(url); } catch (_) {}
  };

  const openWebsite = (website) => {
    if (!website) return;
    let url = String(website).trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    Linking.openURL(url).catch(() => {});
  };

  const toggleSideNav = () => {
    if (isSideNavOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -width * 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => setIsSideNavOpen(false));
    } else {
      setIsSideNavOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    }
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
    <View style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>
  );

  const renderItem = ({ item: c }) => (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={styles.cardOuter}>
        <View style={styles.cardLeft}>
          <Image source={c.image} style={styles.cardImage} resizeMode="contain" />
          {c.latitude && c.longitude ? (
            <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(c)}>
              <Text style={styles.mapsBtnText}>Maps</Text>
            </TouchableOpacity>
          ) : null}
          {!!c.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(c.phone)}>
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cardRight}
          onPress={() => navigation.navigate('MerchantDetailScreen', { merchantId: c.id, prefill: c })}
        >
          <Text style={styles.cardTitle}>{c.name}</Text>
          {!!c.address && <Text style={styles.cardAddress}>{c.address}</Text>}
          {!!c.website && (
            <TouchableOpacity onPress={() => openWebsite(c.website)}>
              <Text style={styles.websiteLink} numberOfLines={1}>{String(c.website).replace(/^https?:\/\//i, '')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.rowBetween}>
            <View style={styles.rowChips}>
              {c.rating ? renderChip(c.rating) : null}
              {c.waitTime ? renderChip(c.waitTime) : null}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary100 }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
      <View style={{ height: insets.top, backgroundColor: COLORS.primary100 }} />
      <View style={styles.container}>
        <View style={styles.banner}>
          <View style={styles.bannerTopRow}>
            <TouchableOpacity style={styles.pillBack} onPress={() => navigation.goBack()}>
              <View style={styles.pillBackInner}><Ionicons name="arrow-back" size={18} color="#3a3a3a" /></View>
            </TouchableOpacity>
            <Text style={styles.bannerTitle}>All Services</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.searchRow}>
            <TouchableOpacity style={styles.menuBox} onPress={toggleSideNav}>
              <Ionicons name="menu" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search services, providers, address..."
                placeholderTextColor="#9AA0A6"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator size="small" color={COLORS.primary} /></View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ paddingVertical: 40, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>No services available</Text>
              </View>
            )}
          />
        )}
        {!!errorMessage && (<Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{errorMessage}</Text>)}
      </View>
      <BottomNavigation activeTab="home" onTabPress={handleTabPress} bottomOffset={28} />
      {isSideNavOpen && (
        <SideNavigation isOpen={isSideNavOpen} onClose={toggleSideNav} slideAnim={slideAnim} fadeAnim={fadeAnim} navigation={navigation} />
      )}
      <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  banner: {
    backgroundColor: COLORS.primary100,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  bannerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillBack: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#d7d7d7', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white,
  },
  pillBackInner: { alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, columnGap: 8 },
  menuBox: { width: 37, height: 36, borderRadius: 8, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flex: 1, height: 36, borderRadius: 8, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 12, color: COLORS.text },
  cardOuter: {
    flexDirection: 'row', backgroundColor: COLORS.primary100, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E3EEFF',
  },
  cardLeft: { width: 97 },
  cardImage: { width: 97, height: 84, borderRadius: 8, backgroundColor: COLORS.white },
  mapsBtn: { backgroundColor: COLORS.primary, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  mapsBtnText: { color: '#FAFAFA', fontSize: 14 },
  callBtn: { backgroundColor: COLORS.secondary800, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  callBtnText: { color: '#FAFAFA', fontSize: 14 },
  cardRight: { flex: 1, marginLeft: 8, backgroundColor: COLORS.white, borderRadius: 12, padding: 12 },
  cardTitle: { color: COLORS.primary1000, fontSize: 16, fontWeight: '700' },
  cardAddress: { marginTop: 4, color: COLORS.text, fontSize: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: COLORS.primary100, borderRadius: 10, height: 21, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: COLORS.chipText, fontSize: 10 },
  websiteLink: { marginTop: 6, color: '#0A4C9A', fontSize: 12, textDecorationLine: 'underline' },
});
