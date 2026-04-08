import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { filterShopsByService, findNearestShops, search } from '../api/Service/Shop';
import { getCustomization, getmyProfile, getNearbyCitiesFallback } from '../api/Service/User';
import KidsCorner from '../Components/Filters/KidsCorner';
import PaisAdd from '../Components/Filters/PaisAdd';
import ServiceFilter from '../Components/Filters/ServiceFilter';
import WomensServices from '../Components/Filters/WomensServices';
import TransparentInfoCard from '../Components/Home/TransparentInfoCard';
import HomeSkeleton from '../Components/Loading/HomeSkeleton';
import BookingReminder from '../Components/Reminder/BookingReminder';
import WeatherOverlay from '../Components/WeatherOverlay';
import { useTabBar } from '../context/TabBarContext';
import { useAppTheme } from '../context/ThemeContext';
import ShopCard from '../Screens/User/ShopCard';
import ShopCarousel from '../Screens/User/ShopCarousel';

const { width } = Dimensions.get('window');

// ─── Top Brands Carousel ───────────────────────────────────────────────────────
const TopBrandsCarousel = ({ shops }: { shops: any[] }) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!shops || shops.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % shops.length;
        try {
          flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        } catch { }
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [shops]);

  if (!shops || shops.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title="Top Brands" onSeeAll={() => router.push('/(tabs)/BookNow')} />
      <FlatList
        ref={flatListRef}
        data={shops}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, idx) => item.id || idx.toString()}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ alignItems: 'center' }}
            onPress={() =>
              router.push({ pathname: '/Screens/User/BarberShopFeed', params: { shop_id: item.id } })
            }
          >
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: '#F1F5F9',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: '#3B82F6',
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <Text
              style={{
                marginTop: 7,
                fontSize: 11,
                fontWeight: '600',
                color: '#1E293B',
                maxWidth: 66,
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 500);
        }}
      />
    </View>
  );
};

// ─── Trending Styles ───────────────────────────────────────────────────────────
const TrendingStyles = ({ styles }: { styles: any[] }) => {
  if (!styles || styles.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title="Trending Now 🔥" />
      <FlatList
        data={styles}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.88}>
            <View
              style={{
                width: 126,
                height: 168,
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.78)']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  justifyContent: 'flex-end',
                  padding: 10,
                }}
              >
                <Text
                  style={{ color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: -0.2 }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 }}>
                  <Ionicons name="flame-outline" size={10} color="#FFA500" />
                  <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '500' }}>
                    {item.popularity} like this
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  onSeeAll,
  seeAllLabel = 'See All →',
}: {
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 14,
      marginBottom: 12,
    }}
  >
    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 }}>
      {title}
    </Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>{seeAllLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Offer Card ────────────────────────────────────────────────────────────────
const homeOffers = [
  {
    id: '1',
    title: '20% OFF First Visit',
    description: 'New customers get 20% off on all services',
    code: 'FIRST20',
    validUntil: '2025-10-31',
    gradient: ['#667EEA', '#764BA2'] as [string, string],
    icon: '🎉',
  },
  {
    id: '2',
    title: 'Free Beard Trim',
    description: 'Get free beard trim with any haircut',
    code: 'BEARDTRIM',
    validUntil: '2025-09-30',
    gradient: ['#F093FB', '#F5576C'] as [string, string],
    icon: '✂️',
  },
];

const renderHomeOfferCard = ({ item }: { item: (typeof homeOffers)[0] }) => (
  <TouchableOpacity activeOpacity={0.9} style={{ width: width * 0.76, marginRight: 12 }}>
    <LinearGradient
      colors={item.gradient}
      style={{ borderRadius: 16, padding: 16 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 4, letterSpacing: -0.3 }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', marginBottom: 10, lineHeight: 16 }}>
            {item.description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.22)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 }}>
                {item.code}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.78)' }}>
              Until {item.validUntil}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 36, marginLeft: 10 }}>{item.icon}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Main Home Screen ──────────────────────────────────────────────────────────
const Home = () => {
  const { category, setCategory, theme: rawTheme } = useAppTheme();
  const theme = {
    headerBackground: rawTheme?.headerBackground ?? '#1D4ED8',
    headerText: rawTheme?.headerText ?? '#FFFFFF',
    subText: rawTheme?.subText ?? 'rgba(255,255,255,0.8)',
    accent: rawTheme?.accent ?? '#3B82F6',
    primary: rawTheme?.primary ?? '#2563EB',
    background: rawTheme?.background ?? '#F8FAFC',
    text: rawTheme?.text ?? '#0F172A',
    ...rawTheme,
  };
  const { tabBarOffset } = useTabBar();
  const lastScrollY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const isTabBarHidden = useSharedValue(false);

  const HEADER_HEIGHT = 268;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;
      scrollY.value = currentScrollY;

      if (currentScrollY <= 0 && isTabBarHidden.value) {
        isTabBarHidden.value = false;
        tabBarOffset.value = withTiming(0, { duration: 200 });
      } else if (currentScrollY > lastScrollY.value + 10 && !isTabBarHidden.value) {
        isTabBarHidden.value = true;
        tabBarOffset.value = withTiming(100, { duration: 200 });
      } else if (currentScrollY < lastScrollY.value - 10 && isTabBarHidden.value) {
        isTabBarHidden.value = false;
        tabBarOffset.value = withTiming(0, { duration: 200 });
      }
      lastScrollY.value = currentScrollY;
    },
  });

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 120], [1, 0], Extrapolate.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 180], [0, -HEADER_HEIGHT], Extrapolate.CLAMP) },
    ],
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  }));

  const isFetchingMoreRef = useRef(false);
  const [shops, setShops] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState('India');
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [cities, setCities] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchData, setSearchData] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showOffers, setShowOffers] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreShops, setHasMoreShops] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalShops, setTotalShops] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [customization, setCustomization] = useState({
    backgroundColor: '#1E40AF',
    backgroundImage: '',
    textColor: '#FFFFFF',
    subTextColor: 'rgba(255, 255, 255, 0.85)',
  });

  const fetchCustomization = async () => {
    try {
      const res = await getCustomization();
      if (res?.success && res?.customization) {
        setCustomization({
          backgroundColor: res.customization.backgroundColor || '#1E40AF',
          backgroundImage: res.customization.backgroundImage || '',
          textColor: res.customization.textColor || '#FFFFFF',
          subTextColor: res.customization.subTextColor || 'rgba(255, 255, 255, 0.85)',
        });
      }
    } catch { }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access in settings.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation(loc);
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo.length > 0) {
        setAddress(geo[0]);
        setSelectedCity(geo[0].city || geo[0].subregion || 'India');
      }
      setCoordinates({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e) {
      console.error(e);
      setError('Failed to get location.');
      setLoading(false);
    }
  };

  const getNearByCities = async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    try {
      const lat = Number(latitude.toFixed(4));
      const lon = Number(longitude.toFixed(4));
      const url = `http://gd.geobytes.com/GetNearbyCities?latitude=${lat}&longitude=${lon}&radius=120`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        const text = await res.text();
        if (text && text.trim() !== '' && text.trim() !== '[["%s"]]') {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0 && data[0][1] !== '%s') {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dist = (la1: number, lo1: number, la2: number, lo2: number) => {
              const R = 6371;
              const dLa = toRad(la2 - la1);
              const dLo = toRad(lo2 - lo1);
              const a =
                Math.sin(dLa / 2) ** 2 +
                Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2;
              return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            };
            const list = data
              .map((i: any) => ({ name: i[1], lat: Number(i[8]), lon: Number(i[10]) }))
              .sort((a: any, b: any) => dist(lat, lon, a.lat, a.lon) - dist(lat, lon, b.lat, b.lon));
            setCities(list);
            return list;
          }
        }
      } catch (e: any) {
        clearTimeout(tid);
      }
      const fallback = await getNearbyCitiesFallback(lat, lon);
      if (fallback?.length > 0) { setCities(fallback); return fallback; }
      return [];
    } catch {
      return [];
    }
  };

  const findNearestShopApi = async (
    page = 1,
    isLoadMore = false,
    isRefresh = false
  ) => {
    if (coordinates.latitude === 0 && coordinates.longitude === 0) return;
    if (isRefresh) { setIsRefreshing(true); setCurrentPage(1); setShops([]); setHasMoreShops(true); }
    else if (isLoadMore) setLoadingMore(true);
    else { setLoading(true); setError(null); }

    try {
      const result = await findNearestShops({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        page,
        limit: 10,
      });
      if (!result?.success) {
        setError(result?.message?.includes('No nearby') ? 'No salons found nearby.' : result?.message || 'Failed to fetch.');
        if (page === 1 || !result?.shops?.length) setHasMoreShops(false);
        return;
      }
      const newShops = result.shops || [];
      isLoadMore ? setShops((p) => [...p, ...newShops]) : setShops(newShops);
      const hasMore = newShops.length === 10;
      setHasMoreShops(result.total !== undefined ? page * 10 < result.total : hasMore);
      if (result.total !== undefined) setTotalShops(result.total);
      setError(null);
    } catch (err: any) {
      setError('Failed to load salons. Please check your connection.');
      if (isLoadMore) setHasMoreShops(false);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const handleRefresh = () => { if (!isRefreshing) findNearestShopApi(1, false, true); };

  const loadMoreShops = useCallback(() => {
    if (isFetchingMoreRef.current || loadingMore || !hasMoreShops) return;
    isFetchingMoreRef.current = true;
    const next = currentPage + 1;
    setCurrentPage(next);
    findNearestShopApi(next, true, false).finally(() => { isFetchingMoreRef.current = false; });
  }, [currentPage, hasMoreShops, loadingMore]);

  const getProfile = async () => {
    if (coordinates.latitude === 0) return;
    try {
      const r = await getmyProfile();
      if (r?.success) setUserProfile(r.user);
    } catch { }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const provider = await AsyncStorage.getItem('authProvider');
            if (provider === 'google') {
              try {
                const in_ = await (GoogleSignin as any).isSignedIn();
                if (in_) { await GoogleSignin.revokeAccess(); await GoogleSignin.signOut(); }
              } catch { }
            }
            await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
            router.replace('/');
          } catch {
            await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
            router.replace('/');
          }
        },
      },
    ]);
  };

  const handleCitySelect = (city: any) => {
    if (!city) return;
    setSelectedCity(city.name);
    setCoordinates({ latitude: Number(city.lat), longitude: Number(city.lon) });
    setShowCityDropdown(false);
    setShops([]); setCurrentPage(1); setHasMoreShops(true);
  };

  const handleServiceChange = async (serviceName: string | null) => {
    setSelectedService(serviceName);
    if (serviceName === 'All' || !serviceName) { setFilteredShops([]); return; }
    if (!shops.length) { setFilteredShops([]); return; }
    try {
      setFilterLoading(true);
      const ids = shops.map((s) => s._id).filter(Boolean);
      const r = await filterShopsByService({ shopIds: ids, serviceName });
      if (r?.success && r.shops) setFilteredShops(r.shops);
      else { setFilteredShops([]); Alert.alert('No Results', `No shops found for "${serviceName}"`); }
    } catch { setFilteredShops([]); }
    finally { setFilterLoading(false); }
  };

  useEffect(() => { getLocation(); fetchCustomization(); }, []);
  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
      findNearestShopApi(1, false);
      getProfile();
      getNearByCities(coordinates);
    }
  }, [coordinates]);
  useEffect(() => {
    if (searchQuery.trim() === '') { setSearchData([]); setIsSearching(false); return; }
    const t = setTimeout(() => {
      setIsSearching(true);
      search(searchQuery.trim())
        .then((r) => setSearchData(r?.shops || []))
        .catch(() => setSearchData([]))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const transformShopData = (apiShops: any[]) =>
    apiShops.map((shop) => {
      let imageUrl = shop.ProfileImage;
      if (!imageUrl && shop.media?.length > 0) {
        const f = shop.media[0];
        imageUrl = typeof f === 'string' ? f : f?.url;
      }
      return {
        id: shop._id,
        name: shop.ShopName?.trim() || 'Unknown Shop',
        location: shop.ExactLocation,
        distance: `${(shop.distance / 1000).toFixed(1)} km`,
        city: shop.City || 'Unknown City',
        timing: shop.Timing || '9am – 8pm',
        mobile: shop.Mobile || '',
        image: imageUrl || 'https://via.placeholder.com/300x200/F1F5F9/64748B?text=Shop',
        rating: shop.rating || 4.5,
        isPremium: shop.IsPremium || false,
      };
    });

  const activeShops = selectedService && selectedService !== 'All' ? filteredShops : shops;
  const transformedActiveShops = transformShopData(activeShops);
  const getPopularShops = () =>
    transformShopData([...activeShops].sort((a, b) => (a.distance || 999999) - (b.distance || 999999)));

  const trendingDesigns = [
    { id: '1', name: 'Fade Cut', popularity: '92%', image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500' },
    { id: '2', name: 'Pompadour', popularity: '87%', image: 'https://images.unsplash.com/photo-1594910344569-a542a5f4bdff?fm=jpg&q=60&w=500' },
    { id: '3', name: 'Undercut', popularity: '89%', image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500' },
  ];

  const categoryConfig = {
    men: { activeBg: '#EFF6FF', text: '#2563EB', icon: 'man' as const },
    womens: { activeBg: '#FFF1F2', text: '#E11D48', icon: 'woman' as const },
    kids: { activeBg: '#FFFBEB', text: '#D97706', icon: 'happy' as const },
  };

  if (loading && shops.length === 0) return <HomeSkeleton />;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Animated Header ── */}
      <Animated.View
        style={[
          animatedHeaderStyle,
          { height: HEADER_HEIGHT, overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
        ]}
      >
        {showOffers && customization.backgroundImage ? (
          <Image
            source={{ uri: customization.backgroundImage }}
            style={{ position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' }}
          />
        ) : (
          <LinearGradient
            colors={['#1D4ED8', '#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
        )}

        {/* Decorative blobs */}
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -50 }} />
        <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20 }} />

        <View style={{ flex: 1, paddingTop: 46, paddingHorizontal: 16 }}>
          {/* Top Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            {/* Location pill */}
            <TouchableOpacity
              onPress={() => setShowCityDropdown(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.16)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                gap: 5,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.22)',
              }}
            >
              <Ionicons name="location-outline" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                {selectedCity}
              </Text>
              <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Offers toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 18,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>Offers</Text>
                <Switch
                  value={showOffers}
                  onValueChange={setShowOffers}
                  trackColor={{ false: 'rgba(255,255,255,0.25)', true: 'rgba(255,255,255,0.5)' }}
                  thumbColor="#FFF"
                  style={{ transform: [{ scale: 0.72 }] }}
                />
              </View>

              {/* Logout */}
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  padding: 8,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Headline */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: '500', letterSpacing: 0.2 }}>
              Find your perfect
            </Text>
            <Text style={{ fontSize: 26, color: '#FFF', fontWeight: '800', marginTop: 1, letterSpacing: -0.5 }}>
              style match ✂️
            </Text>
          </View>

          {/* Search bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFF',
              borderRadius: 28,
              paddingHorizontal: 14,
              height: 46,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Ionicons name="search-outline" size={18} color="#3B82F6" style={{ marginRight: 9 }} />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#0F172A', paddingVertical: 0, fontWeight: '500' }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search salons, services..."
              placeholderTextColor="#94A3B8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchData([]); }}>
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* ── City Picker Modal ── */}
      <Modal
        visible={showCityDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityDropdown(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCityDropdown(false)}
        >
          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 20,
              width: '88%',
              maxHeight: '70%',
              overflow: 'hidden',
              shadowColor: '#1E40AF',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cities.map((city, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F1F5F9',
                    backgroundColor: selectedCity === city.name ? '#EFF6FF' : '#FFF',
                  }}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={selectedCity === city.name ? '#2563EB' : '#94A3B8'}
                  />
                  <Text
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 14,
                      color: selectedCity === city.name ? '#1D4ED8' : '#374151',
                      fontWeight: selectedCity === city.name ? '600' : '400',
                    }}
                  >
                    {city.name}
                  </Text>
                  {selectedCity === city.name && (
                    <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <BookingReminder />

      {/* ── Main Scroll ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {searchQuery.length > 0 ? (
          <>
            {isSearching ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1877F2" />
                <Text style={{ marginTop: 16, color: '#1877F2', fontWeight: '500' }}>Searching salons...</Text>
              </View>
            ) : (
              <FlatList
                data={searchData}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  let shopName = item.ShopName?.trim() || 'Unknown Shop';
                  let imageUrl = item.ProfileImage;
                  if (!imageUrl && item.media?.length > 0) {
                    const first = item.media[0];
                    imageUrl = typeof first === 'string' ? first : first?.url;
                  }
                  const displayImage = imageUrl || 'https://via.placeholder.com/300x200/F1F5F9/94A3B8?text=Shop';
                  
                  return (
                    <TouchableOpacity 
                      style={{
                        flexDirection: 'row',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        padding: 14,
                        marginHorizontal: 16,
                        marginBottom: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: '#EEF2FF'
                      }}
                      onPress={() => router.push({ pathname: '/Screens/User/BarberShopFeed', params: { shop_id: item._id } })}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 85, height: 85, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                        <Image source={{ uri: displayImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 }} numberOfLines={1}>
                            {shopName}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E', marginLeft: 4 }}>
                              {item.rating || '4.5'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }} numberOfLines={1}>
                          <Ionicons name="location-outline" size={12} color="#94A3B8" /> {item.ExactLocation || item.City || 'Location not specified'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                            <Ionicons name="time-outline" size={14} color="#1877F2" />
                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#1877F2', marginLeft: 4 }}>
                              {item.Timing || '9 AM - 8 PM'}
                            </Text>
                          </View>
                          {item.IsPremium && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                               <Ionicons name="diamond" size={10} color="#4F46E5" />
                               <Text style={{ fontSize: 10, fontWeight: '700', color: '#4F46E5', marginLeft: 4 }}>PREMIUM</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 }}>
                    <Ionicons name="search-outline" size={64} color="#BFDBFE" />
                    <Text style={{ marginTop: 16, fontSize: 16, textAlign: 'center', color: '#6B7280' }}>
                      No salons found for "{searchQuery}"
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '600', textAlign: 'center', color: '#1E293B', marginBottom: 6 }}>
                    No results found
                  </Text>
                  <Text style={{ fontSize: 13, textAlign: 'center', color: '#64748B' }}>
                    Couldn't find any salons for "{searchQuery}"
                  </Text>
                </View>
              )}
              scrollEnabled={false}
            />
          )
        ) : (
          <>
            <WeatherOverlay />

            {/* Category Tabs */}
            <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 14, paddingHorizontal: 14 }}>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#FFF',
                  borderRadius: 24,
                  padding: 4,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {(['men', 'womens', 'kids'] as const).map((cat) => {
                  const isSelected = category === cat;
                  const cfg = categoryConfig[cat];
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.75}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isSelected ? cfg.activeBg : 'transparent',
                      }}
                    >
                      <Ionicons
                        name={cfg.icon}
                        size={15}
                        color={isSelected ? cfg.text : '#94A3B8'}
                      />
                      <Text
                        style={{
                          color: isSelected ? cfg.text : '#94A3B8',
                          fontSize: 13,
                          fontWeight: isSelected ? '700' : '500',
                          textTransform: 'capitalize',
                        }}
                      >
                        {cat === 'womens' ? 'Women' : cat === 'men' ? 'Men' : 'Kids'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Service Filters */}
            <View style={{ marginBottom: 10 }}>
              {category === 'womens' ? (
                <WomensServices onServiceChange={handleServiceChange} />
              ) : category === 'kids' ? (
                <KidsCorner onServiceChange={handleServiceChange} />
              ) : (
                <>
                  <SectionHeader title="Services" seeAllLabel="View All →" />
                  <ServiceFilter onServiceChange={handleServiceChange} />
                </>
              )}
            </View>

            {filterLoading ? (
              <View style={{ padding: 50, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 12, color: '#2563EB', fontWeight: '600', fontSize: 13 }}>
                  Finding salons...
                </Text>
              </View>
            ) : (
              <>
                <TopBrandsCarousel shops={transformedActiveShops} />

                {activeShops.length > 0 && (
                  <ShopCarousel
                    title="Nearby Salons"
                    shops={getPopularShops().slice(0, 5)}
                    onViewAll={() => router.push('/(tabs)/BookNow')}
                  />
                )}

                <TrendingStyles styles={trendingDesigns} />

                {showOffers && (
                  <View style={{ marginBottom: 20 }}>
                    <SectionHeader title="Special Offers 🎁" seeAllLabel="All Offers →" />
                    <FlatList
                      data={homeOffers}
                      renderItem={renderHomeOfferCard}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 14 }}
                    />
                  </View>
                )}

                {activeShops.length > 5 && (
                  <ShopCarousel
                    title="Recommended For You"
                    shops={transformedActiveShops.slice(5, 10)}
                    onViewAll={() => router.push('/(tabs)/BookNow')}
                  />
                )}

                <TransparentInfoCard />
                <PaisAdd />
              </>
            )}
          </>
        )}

        {loadingMore && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={{ marginTop: 6, color: '#64748B', fontSize: 11 }}>Loading more...</Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

export default Home;
