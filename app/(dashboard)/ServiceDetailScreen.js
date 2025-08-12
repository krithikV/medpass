import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import images from '../../assets/images';
import BottomNavigation from '../../components/BottomNavigation';

const COLORS = {
  primary: '#0065fb',
  primary100: '#dae9ff',
  primary1000: '#002965',
  secondary800: '#01a1a6',
  text: '#3a3a3a',
  white: '#ffffff',
  underline: '#01a1a6',
};

export default function ServiceDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const serviceId = route?.params?.serviceId;
  const merchantData = route?.params?.merchantData || {};
  const serviceName = route?.params?.serviceName || 'Service';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [subServices, setSubServices] = useState([]);
  const [addressData, setAddressData] = useState(null);
  const [workingHours, setWorkingHours] = useState([]);

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

  const fetchServiceDetails = useCallback(async () => {
    if (!serviceId) return;
    try {
      setErrorMessage('');
      const url = `https://api.mediimpact.in/index.php/user/get_services/${serviceId}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Request failed: ${resp.status}`);
      }
      const json = await resp.json();
      
      if (json?.merchant_data && Array.isArray(json.merchant_data)) {
        setSubServices(json.merchant_data);
      }
      
      if (json?.address_data) {
        setAddressData(json.address_data);
      }
      
      if (json?.work_data && Array.isArray(json.work_data)) {
        setWorkingHours(json.work_data);
      }
    } catch (e) {
      setErrorMessage(e.message || 'Unable to load service details');
      setSubServices([]);
      setAddressData(null);
      setWorkingHours([]);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchServiceDetails();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openMaps = () => {
    if (!addressData) return;
    const label = encodeURIComponent(addressData.provider_name || 'Location');
    let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${addressData.latitude || ''},${addressData.longitude || ''}`
    )}`;
    
    if (addressData.latitude && addressData.longitude) {
      url = Platform.select({
        ios: `https://maps.apple.com/?q=${label}&ll=${addressData.latitude},${addressData.longitude}`,
        android: `geo:0,0?q=${addressData.latitude},${addressData.longitude}(${label})`,
        default: url,
      });
    } else {
      const query = encodeURIComponent(`${addressData.provider_name || ''} ${addressData.address || ''}`.trim());
      url = Platform.select({
        ios: `https://maps.apple.com/?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
      });
    }
    Linking.openURL(url).catch(() => {});
  };

  const openPhoneLink = (phone) => {
    if (!phone) return;
    const tel = Platform.select({ ios: `tel://${phone}`, android: `tel:${phone}`, default: `tel:${phone}` });
    Linking.openURL(tel).catch(() => {});
  };

  const openEmailLink = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  const renderChip = (label) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );

  const renderSubServiceCard = (service, index) => {
    const hasHomeCollection = service?.homecollection === '1';
    const discount = service?.discount;
    
    return (
      <LinearGradient
        key={`${service?.serviceid || index}`}
        colors={index % 2 === 0 ? ['#E9FAFF', '#D7F2FF'] : ['#E4ECFF', '#D5E3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.serviceCard}
      >
        <View style={styles.serviceCardContent}>
          <View>
            <Text style={styles.serviceTitle} numberOfLines={2}>
              {service?.sub_service_name || service?.main_service_name || 'Service'}
            </Text>
            {discount && (
              <Text style={styles.serviceDiscount}>{discount}% Off</Text>
            )}
            {hasHomeCollection && (
              <View style={[styles.chip, { alignSelf: 'flex-start', marginTop: 8 }]}>
                <Text style={styles.chipText}>Home Collection</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.serviceBookBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PaymentScreen', {
              serviceName: service?.sub_service_name || service?.main_service_name || 'Service',
              serviceId: service?.serviceid || serviceId,
            })}
          >
            <Text style={styles.serviceBookText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  const renderWorkingHours = () => {
    if (!workingHours || workingHours.length === 0) return null;
    
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Working Hours</Text>
        <View style={styles.whContainer}>
          {workingHours.map((day, index) => {
            const isOpen = day?.working_tag === '1';
            const dayLabel = (day?.day || '').slice(0, 3);
            return (
              <View key={index} style={styles.whRow}>
                <View style={styles.whDayPill}>
                  <Text style={styles.whDayText}>{dayLabel}</Text>
                </View>
                {isOpen ? (
                  <View style={styles.whTimes}>
                    <View style={styles.whBadge}>
                      <Ionicons name="sunny-outline" size={12} color="#0A4C9A" />
                      <Text style={styles.whBadgeText}>{day.mrg_from} - {day.mrg_to}</Text>
                    </View>
                    <View style={styles.whBadge}>
                      <Ionicons name="moon-outline" size={12} color="#0A4C9A" />
                      <Text style={styles.whBadgeText}>{day.eve_from} - {day.eve_to}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.whClosedBadge}>
                    <Text style={styles.whClosedText}>Closed</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary100 }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary100} />
      <View style={{ height: insets.top, backgroundColor: COLORS.primary100 }} />
      <View style={styles.pageRoot}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.primary1000} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.appName}>Medpass</Text>
            </View>
            <Text style={styles.headerPageTitle}>Services</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : errorMessage ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: 'red' }}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchServiceDetails}>
              <Text style={{ color: COLORS.white, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          >
            {/* Service info card */}
            <View style={styles.card}>
              <Text style={styles.title}>{serviceName}</Text>
              {addressData?.provider_name && (
                <Text style={styles.subText}>{addressData.provider_name}</Text>
              )}
              {addressData?.address && (
                <Text style={styles.subText}>{addressData.address}</Text>
              )}
              <Text style={styles.subText}>
                {addressData?.city_name?.trim() || ''} {addressData?.state_name ? `, ${addressData.state_name}` : ''}
              </Text>

              {/* Contact info */}
              {addressData?.phone_no && (
                <TouchableOpacity onPress={() => openPhoneLink(addressData.phone_no)}>
                  <Text style={styles.contactLink} numberOfLines={1}>{addressData.phone_no}</Text>
                </TouchableOpacity>
              )}
              {addressData?.email && (
                <TouchableOpacity onPress={() => openEmailLink(addressData.email)}>
                  <Text style={styles.contactLink} numberOfLines={1}>{addressData.email}</Text>
                </TouchableOpacity>
              )}

              {/* Action buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
                  <Ionicons name="map" size={16} color={COLORS.white} />
                  <Text style={styles.actionText}>Maps</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sub-services */}
            {subServices && subServices.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12, marginBottom: 8 }]}>Available Services</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.servicesScroll}
                >
                  {subServices.map((service, idx) => renderSubServiceCard(service, idx))}
                </ScrollView>
              </>
            )}

            {/* Working hours */}
            {renderWorkingHours()}

            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation activeTab="home" onTabPress={handleTabPress} />
      </View>

      <View style={{ height: insets.bottom, backgroundColor: COLORS.white }} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary100,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  headerPageTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi',
    fontWeight: '600',
    color: '#017f83',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E3EEFF',
  },
  title: {
    color: COLORS.primary1000,
    fontSize: 18,
    fontWeight: '700',
  },
  subText: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 13,
  },
  contactLink: {
    marginTop: 6,
    color: '#0A4C9A',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary1000,
    marginBottom: 8,
  },
  servicesScroll: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  serviceCard: {
    width: 280,
    height: 156,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  serviceCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceTitle: {
    color: '#0E4B8E',
    fontSize: 18,
    fontWeight: '800',
  },
  serviceDiscount: {
    marginTop: 8,
    color: '#0E4B8E',
    fontSize: 16,
    fontWeight: '700',
  },
  chip: {
    backgroundColor: COLORS.primary100,
    borderRadius: 10,
    height: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: '#0065fb',
    fontSize: 12,
  },
  serviceBookBtn: {
    backgroundColor: '#0A4C9A',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  serviceBookText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // Working hours (modern compact)
  whContainer: {
    marginTop: 4,
    gap: 8,
  },
  whRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6FAFF',
    borderWidth: 1,
    borderColor: '#E3EEFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  whDayPill: {
    backgroundColor: '#0A4C9A0D',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CFE2FF',
    minWidth: 48,
    alignItems: 'center',
  },
  whDayText: {
    color: '#0A4C9A',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  whTimes: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 10,
  },
  whBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  whBadgeText: {
    color: '#0A4C9A',
    fontWeight: '600',
    fontSize: 12,
  },
  whClosedBadge: {
    backgroundColor: '#FFF1F1',
    borderColor: '#FFD6D6',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  whClosedText: {
    color: '#B00020',
    fontWeight: '700',
    fontSize: 12,
  },
  // end working hours styles
  workingDayRow: {
    display: 'none',
  },
  dayText: {
    display: 'none',
  },
  timeContainer: {
    display: 'none',
  },
  timeText: {
    display: 'none',
  },
});
