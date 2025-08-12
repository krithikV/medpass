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

export default function MerchantDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const merchantIdParam = route?.params?.merchantId;
  const prefill = route?.params?.prefill || null;
  const merchantId = typeof merchantIdParam === 'number' ? merchantIdParam : Number(merchantIdParam);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [merchant, setMerchant] = useState(null);
  const [services, setServices] = useState([]);
  const [website, setWebsite] = useState('');
  // Always use the same base URL as Services list
  const [logoBase] = useState('https://mediimpact.in/assets/img/logo/');

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

  const fetchDetails = useCallback(async () => {
    if (!merchantId) return;
    try {
      setErrorMessage('');
      const url = `https://api.mediimpact.in/index.php/user/get_single_merchant/${merchantId}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Request failed: ${resp.status}`);
      }
      const json = await resp.json();
      if (json?.status !== 200 || !json?.merchant_data) {
        throw new Error(json?.message || 'Unable to load details');
      }
      setMerchant(json.merchant_data);
      setServices(Array.isArray(json.service_data) ? json.service_data : []);
      const apiWebsite = json?.merchant_data?.merchant_website || json?.merchant_data?.website || '';
      if (apiWebsite) setWebsite(apiWebsite);
    } catch (e) {
      setErrorMessage(e.message || 'Unable to load details');
      setMerchant(null);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    if (prefill?.website) setWebsite(prefill.website);
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchDetails();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCall = (phone) => {
    if (!phone) return;
    const url = Platform.select({ ios: `tel://${phone}`, android: `tel:${phone}`, default: `tel:${phone}` });
    Linking.openURL(url).catch(() => {});
  };

  const openMaps = () => {
    if (!merchant) return;
    const label = encodeURIComponent(merchant.provider_display_name || 'Location');
    let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${merchant.latitude || ''},${merchant.longitude || ''}`
    )}`;
    if (merchant.latitude && merchant.longitude) {
      url = Platform.select({
        ios: `https://maps.apple.com/?q=${label}&ll=${merchant.latitude},${merchant.longitude}`,
        android: `geo:0,0?q=${merchant.latitude},${merchant.longitude}(${label})`,
        default: url,
      });
    } else {
      const query = encodeURIComponent(`${merchant.provider_display_name || ''} ${merchant.address || ''}`.trim());
      url = Platform.select({
        ios: `https://maps.apple.com/?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
      });
    }
    Linking.openURL(url).catch(() => {});
  };

  const openWebsite = () => {
    if (!website) return;
    let url = String(website).trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
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

  const getNumericPercent = (s) => {
    const candidates = [
      s?.max_discount,
      s?.discount_percent,
      s?.discount,
      s?.cashback,
      s?.offer_percent,
      s?.offer,
    ];
    for (const val of candidates) {
      if (val == null) continue;
      const num = Number(String(val).replace(/[^0-9.\-]/g, ''));
      if (!Number.isNaN(num) && Number.isFinite(num) && num > 0) return Math.round(num);
    }
    return null;
  };

  const getServiceImage = (s) => {
    const url = s?.image_url || s?.image || s?.icon || null;
    if (typeof url === 'string' && url.length > 4) {
      return { uri: url };
    }
    return images.clinicImage20;
  };

  const renderServiceCard = (service, index) => {
    const percent = getNumericPercent(service);
    const fallbackTitle = service?.main_service_name || service?.service_name || 'Service';
    const title = percent ? `${percent}% cash back on all services` : fallbackTitle;
    const hasHomeCollection = service?.homecollection === '1';
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
            <Text style={styles.serviceTitle} numberOfLines={2}>{title}</Text>
            {/* Subtitle removed per requirement */}
            {hasHomeCollection ? (
              <View style={[styles.chip, { alignSelf: 'flex-start', marginTop: 8 }]}>
                <Text style={styles.chipText}>Home Collection</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.serviceViewMoreBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ServiceDetailScreen', {
              serviceId: service?.serviceid || serviceId,
              serviceName: title,
              merchantData: merchant || prefill,
            })}
          >
            <Text style={styles.serviceViewMoreText}>View more</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
            <Text style={styles.headerPageTitle}>Details</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : errorMessage ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: 'red' }}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDetails}>
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
            {/* Big header image */}
            <View style={styles.heroImageWrap}>
              <Image
                source={(() => {
                  const logo = merchant?.logo || prefill?.logoFileName;
                  return logo ? { uri: `${logoBase}${logo}` } : images.clinicImage19;
                })()}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{merchant?.provider_display_name || prefill?.name || 'Merchant'}</Text>
              {!!(merchant?.address || prefill?.address) && (
                <Text style={styles.subText}>{merchant?.address || prefill?.address}</Text>
              )}
              <Text style={styles.subText}>
                {((merchant?.city_name || '').trim() || '')} {merchant?.state_name ? `, ${merchant.state_name}` : ''}
              </Text>
              {!!website && (
                <TouchableOpacity onPress={openWebsite}>
                  <Text style={styles.websiteLink} numberOfLines={1}>
                    {String(website).replace(/^https?:\/\//i, '')}
                  </Text>
                </TouchableOpacity>
              )}
              {/* Phone below website as clickable link */}
              {(() => {
                const phone = merchant?.phone_no || merchant?.merchant_mobile || prefill?.phone || '';
                return phone ? (
                  <TouchableOpacity onPress={() => openPhoneLink(phone)}>
                    <Text style={styles.contactLink} numberOfLines={1}>{phone}</Text>
                  </TouchableOpacity>
                ) : null;
              })()}
              {/* Email clickable link */}
              {(() => {
                const email = merchant?.merchant_email || prefill?.merchant_email || prefill?.email || '';
                return email ? (
                  <TouchableOpacity onPress={() => openEmailLink(email)}>
                    <Text style={styles.contactLink} numberOfLines={1}>{email}</Text>
                  </TouchableOpacity>
                ) : null;
              })()}

              {/* Meta chips row (distance, discount/category) */}
              <View style={[styles.chipsRow, { marginTop: 12 }] }>
                {prefill?.kmsRaw != null ? renderChip(`${prefill.kmsRaw.toFixed(1)} km`) : null}
                {prefill?.maxDiscount != null ? renderChip(`${prefill.maxDiscount}% Off`) : null}
                {prefill?.category ? renderChip(prefill.category) : null}
              </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
                      <Ionicons name="map" size={16} color={COLORS.white} />
                      <Text style={styles.actionText}>Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {services && services.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 12, marginBottom: 8 }]}>Services</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.servicesScroll}
                    >
                      {services.map((s, idx) => renderServiceCard(s, idx))}
                    </ScrollView>
                  </>
                )}

                {!!merchant?.notes && (
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.subText}>{merchant.notes}</Text>
                  </View>
                )}

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
  heroImageWrap: {
    width: '100%',
    height: 200,
    backgroundColor: '#fff',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E3EEFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  merchantLogo: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3EEFF',
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicesScroll: {
    paddingVertical: 4,
    paddingRight: 4,
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
  websiteLink: {
    marginTop: 8,
    color: '#0A4C9A',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  contactLink: {
    marginTop: 6,
    color: '#0A4C9A',
    fontSize: 13,
    textDecorationLine: 'underline',
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
  serviceSubtitle: {
    marginTop: 8,
    color: '#0E4B8E',
    opacity: 0.85,
    fontSize: 14,
  },
  serviceApplyBtn: { display: 'none' },
  serviceApplyText: { display: 'none' },
  serviceViewMoreBtn: {
    backgroundColor: '#0A4C9A',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  serviceViewMoreText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // serviceImage removed as per requirement
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  payBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});


