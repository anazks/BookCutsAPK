import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { BlurView } from 'expo-blur';
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
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { filterShopsByService, findNearestShops, search } from '../api/Service/Shop';
import { getmyProfile, getNearbyCitiesFallback } from '../api/Service/User';
import PaisAdd from '../Components/Filters/PaisAdd';
import ServiceFilter from '../Components/Filters/ServiceFilter';
import BookingReminder from '../Components/Reminder/BookingReminder';
import ShopCard from '../Screens/User/ShopCard';
import ShopCarousel from '../Screens/User/ShopCarousel';

const { width } = Dimensions.get('window');

const Home = () => {
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

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreShops, setHasMoreShops] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalShops, setTotalShops] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
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
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setAddress(addr);
        const locality = addr.city || addr.subregion || 'India';
        setSelectedCity(locality);
      }
      setCoordinates({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location. Please check your settings.');
      setLoading(false);
    }
  };

  const getNearByCities = async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    try {
      const lat = Number(latitude.toFixed(4));
      const lon = Number(longitude.toFixed(4));
      const geobytesUrl = `http://gd.geobytes.com/GetNearbyCities?latitude=${lat}&longitude=${lon}&radius=120`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(geobytesUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        const text = await res.text();
        if (text && text.trim() !== '' && text.trim() !== '[["%s"]]') {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0 && data[0][1] !== '%s') {
              const citiesList = data.map((item: any) => ({
                name: item[1],
                lat: Number(item[8]),
                lon: Number(item[10]),
              }));
              const toRad = (deg: number) => (deg * Math.PI) / 180;
              const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371;
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
                return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              };
              const sorted = citiesList.sort(
                (a: any, b: any) => distanceKm(lat, lon, a.lat, a.lon) - distanceKm(lat, lon, b.lat, b.lon)
              );
              setCities(sorted);
              return sorted;
            }
          } catch (parseErr) {
            console.warn('Geobytes parse failed:', parseErr);
          }
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          console.warn('Geobytes request timed out');
        } else {
          console.warn('Geobytes fetch failed:', fetchErr);
        }
      }
      console.log('Geobytes failed → using fallback API');
      const fallbackCities = await getNearbyCitiesFallback(lat, lon, 15);
      if (fallbackCities?.length > 0) {
        setCities(fallbackCities);
        return fallbackCities;
      }
      console.warn('No cities from either source');
      return [];
    } catch (err) {
      console.error('Failed to fetch nearby cities (both methods):', err);
      return [];
    }
  };

   const findNearestShopApi = async (
  page: number = 1,
  isLoadMore: boolean = false,
  isRefresh: boolean = false
) => {
  // Early return if we don't have coordinates yet
  if (coordinates.latitude === 0 && coordinates.longitude === 0) {
    console.warn('findNearestShopApi called without valid coordinates');
    return;
  }

  // ─── Set appropriate loading states ───
  if (isRefresh) {
    setIsRefreshing(true);
    setCurrentPage(1);           // reset pagination on pull-to-refresh
    setShops([]);                // clear old data on full refresh (optional but recommended)
    setHasMoreShops(true);       // optimistic reset
  } else if (isLoadMore) {
    setLoadingMore(true);
  } else {
    setLoading(true);
    setError(null);              // clear previous errors on fresh load
  }

  try {
    const payload = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      page,
      limit: 10,
    };

    console.log('Fetching shops →', payload);

    const result = await findNearestShops(payload);

    console.log('API Response:', result);

    if (!result?.success) {
      // Handle backend saying "no shops" or other failure
      if (result?.message?.includes('No nearby shops found')) {
        setError('No salons found nearby.');
      } else {
        setError(result?.message || 'Failed to fetch nearby salons.');
      }

      // Important: stop pagination if explicit "no shops" message
      if (page === 1 || result?.shops?.length === 0) {
        setHasMoreShops(false);
      }

      return;
    }

    const newShops = result.shops || [];

    // ─── Update shops list ───
    if (isLoadMore) {
      // Append for infinite scroll
      setShops((prev) => [...prev, ...newShops]);
    } else {
      // Replace on initial load or refresh
      setShops(newShops);
    }

    // ─── Update pagination state ───
    const receivedCount = newShops.length;
    const pageSize = 10;

    // Most reliable way: if we got fewer items than requested → end reached
    const hasMore = receivedCount === pageSize;

    setHasMoreShops(hasMore);

    // Bonus: if backend sends total count, use it for even better UX
    if (result.total !== undefined && result.total !== null) {
      setTotalShops(result.total);
      // More precise hasMore calculation
      setHasMoreShops(page * pageSize < result.total);
    }

    setError(null);
  } catch (err: any) {
    console.log('Error fetching shops:', err);

    let errorMessage = 'Failed to load salons. Please check your connection.';

    if (err?.response?.status === 404) {
      errorMessage = 'No salons found in this area.';
      setHasMoreShops(false);
    } else if (err?.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Try again later.';
    } else if (err?.message?.includes('network')) {
      errorMessage = 'Network error. Please check your internet.';
    }

    setError(errorMessage);

    // Stop trying to load more on error
    if (isLoadMore) {
      setHasMoreShops(false);
    }
  } finally {
    // ─── Always clean up loading states ───
    if (isRefresh) {
      setIsRefreshing(false);
    } else if (isLoadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  }
};
    const handleRefresh = () => {
      if (!isRefreshing) {
        findNearestShopApi(1, false, true);
      }
    };

   const loadMoreShops = useCallback(() => {
  // ─── The three most important guards ───
  if (isFetchingMoreRef.current) return;
  if (loadingMore) return;
  if (!hasMoreShops) return;

  isFetchingMoreRef.current = true;
  setLoadingMore(true);

  const nextPage = currentPage + 1;
  setCurrentPage(nextPage);

  findNearestShopApi(nextPage, true, false)
    .finally(() => {
      isFetchingMoreRef.current = false;
      setLoadingMore(false);
    });

}, [currentPage, hasMoreShops, loadingMore]);



  const getProfile = async () => {
    if (coordinates.latitude === 0 && coordinates.longitude === 0) return;
    try {
      const response = await getmyProfile(coordinates);
      if (response?.success) setUserProfile(response.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const authProvider = await AsyncStorage.getItem('authProvider');
            if (authProvider === 'google') {
              try {
                const isGoogleSignedIn = await GoogleSignin.isSignedIn();
                if (isGoogleSignedIn) {
                  await GoogleSignin.revokeAccess();
                  await GoogleSignin.signOut();
                }
              } catch (googleErr: any) {
                if (googleErr.code !== 'SIGN_IN_REQUIRED') console.log('Google sign-out failed:', googleErr);
              }
            }
            await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
            router.replace('/Screens/User/Login');
          } catch (error) {
            console.error('Logout Error:', error);
            await AsyncStorage.multiRemove(['accessToken', 'shopId', 'authProvider']);
            router.replace('/Screens/User/Login');
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
    setShops([]);
    setCurrentPage(1);
    setHasMoreShops(true);
  };

  const handleServiceChange = async (serviceName: string | null) => {
    setSelectedService(serviceName);
    if (serviceName === 'All' || !serviceName) { setFilteredShops([]); return; }
    if (!shops.length) { setFilteredShops([]); return; }
    try {
      setFilterLoading(true);
      const shopIds = shops.map((shop) => shop._id).filter(Boolean);
      const response = await filterShopsByService({ shopIds, serviceName });
      if (response?.success && response.shops) {
        setFilteredShops(response.shops);
      } else {
        setFilteredShops([]);
        Alert.alert('No Results', `No shops found offering "${serviceName}"`);
      }
    } catch (error) {
      console.error('Service filter error:', error);
      setFilteredShops([]);
    } finally {
      setFilterLoading(false);
    }
  };

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
      findNearestShopApi(1, false);
      getProfile();
      getNearByCities(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (searchQuery.trim() === '') { setSearchData([]); setIsSearching(false); return; }
    const timer = setTimeout(() => performSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await search(query.trim());
      setSearchData(response?.shops || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchData([]);
    } finally {
      setIsSearching(false);
    }
  };

  const transformShopData = (apiShops: any[]) => {
    return apiShops.map((shop) => {
      let shopName = 'Unknown Shop';
      if (shop.ShopName?.trim()) shopName = shop.ShopName.trim();
      let imageUrl = shop.ProfileImage;
      if (!imageUrl && shop.media?.length > 0) {
        const first = shop.media[0];
        imageUrl = typeof first === 'string' ? first : first?.url;
      }
      return {
        id: shop._id,
        name: shopName,
        location: shop.ExactLocation,
        distance: `${(shop.distance / 1000).toFixed(1)} km`,
        city: shop.City || 'Unknown City',
        timing: shop.Timing || '9am - 8pm',
        mobile: shop.Mobile || '',
        website: shop.website || '',
        image: imageUrl || 'https://via.placeholder.com/300x200/FAFAFA/666666?text=Shop',
        rating: shop.rating || 4.5,
      };
    });
  };

  const activeShops = selectedService && selectedService !== 'All' ? filteredShops : shops;
  const transformedActiveShops = transformShopData(activeShops);

  const getPopularShops = () => {
    const sorted = [...activeShops].sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
    return transformShopData(sorted);
  };

  const trendingDesigns = [
    { id: '1', name: 'Fade Cut', popularity: '92%', image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500' },
    { id: '2', name: 'Pompadour', popularity: '87%', image: 'https://images.unsplash.com/photo-1594910344569-a542a5f4bdff?fm=jpg&q=60&w=500' },
    { id: '3', name: 'Undercut', popularity: '89%', image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500' },
  ];

  if (loading && shops.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1877F2' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ marginTop: 16, color: '#FFFFFF', fontWeight: '600' }}>Loading shops...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Zomato-style layered header with creative background */}
      <View style={{
        height: 260,
        position: 'relative',
        overflow: 'hidden',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      }}>
        {/* Background Pattern - Wave Layer */}
        <View style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#1877F2',
        }}>
          <View style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            top: -50,
            right: -50,
          }} />
          <View style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            bottom: -100,
            left: -100,
          }} />
          <View style={{
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            top: 40,
            left: 30,
          }} />
        </View>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(24, 119, 242, 0.95)', 'rgba(24, 119, 242, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />

        {/* Header Content */}
        <View style={{
          flex: 1,
          paddingTop: 48,
          paddingHorizontal: 20,
        }}>
          {/* Top Bar */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            {/* City selector with Zomato-style pill */}
            <TouchableOpacity
              style={{
                borderRadius: 25,
                overflow: 'hidden',
              }}
              onPress={() => setShowCityDropdown(true)}
            >
              <BlurView intensity={20} tint="light" style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
                gap: 6,
              }}>
                <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                }}>{selectedCity}</Text>
                <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>

            {/* Right icons with glassmorphism */}
            <View style={{
              flexDirection: 'row',
              gap: 8,
            }}>
              <TouchableOpacity style={{
                borderRadius: 20,
                overflow: 'hidden',
              }}>
                <BlurView intensity={20} tint="light" style={{
                  padding: 8,
                  borderRadius: 20,
                }}>
                  <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{
                borderRadius: 20,
                overflow: 'hidden',
              }}>
                <BlurView intensity={20} tint="light" style={{
                  padding: 8,
                  borderRadius: 20,
                }}>
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={{
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '400',
            }}>Find your perfect</Text>
            <Text style={{
              fontSize: 32,
              color: '#FFFFFF',
              fontWeight: '700',
              marginTop: -4,
            }}>style match</Text>
          </View>

          {/* Zomato-style Search Bar with depth effect */}
          <View style={{
            position: 'relative',
            marginTop: 4,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 30,
              paddingHorizontal: 16,
              paddingVertical: 4,
              height: 52,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              position: 'relative',
              zIndex: 2,
            }}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 30,
                }}
              />
              <Ionicons name="search-outline" size={18} color="#1877F2" style={{ marginRight: 10, zIndex: 3 }} />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: '#1A1F36',
                  paddingVertical: 12,
                  zIndex: 3,
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for salons, services..."
                placeholderTextColor="#94A3B8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => { setSearchQuery(''); setSearchData([]); }}
                  style={{ padding: 4, zIndex: 3 }}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Decorative search bar shadow layer */}
            <View style={{
              position: 'absolute',
              bottom: -6,
              left: 10,
              right: 10,
              height: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: 30,
              zIndex: 1,
            }} />
          </View>
        </View>
      </View>

      <BookingReminder />

      {/* ── City Modal ── */}
      <Modal visible={showCityDropdown} transparent animationType="fade" onRequestClose={() => setShowCityDropdown(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCityDropdown(false)}
        >
          <View style={{
            backgroundColor: '#FFF',
            borderRadius: 16,
            width: '90%',
            maxHeight: '70%',
            shadowColor: '#0D4FB5',
            shadowOpacity: 0.2,
            elevation: 8,
            overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#DBEAFE',
              backgroundColor: '#EEF4FF',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1877F2' }}>Select Your Location</Text>
              <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                <Ionicons name="close" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {cities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#EEF4FF',
                    backgroundColor: selectedCity === city.name ? '#EEF4FF' : '#FFF',
                  }}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons name="location-outline" size={20} color={selectedCity === city.name ? '#1877F2' : '#9CA3AF'} />
                  <Text style={{
                    flex: 1,
                    marginLeft: 12,
                    color: selectedCity === city.name ? '#1877F2' : '#374151',
                    fontWeight: selectedCity === city.name ? '600' : '400',
                  }}>{city.name}</Text>
                  {selectedCity === city.name && <Ionicons name="checkmark-circle" size={20} color="#1877F2" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Main Scroll ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#1877F2']}
            tintColor="#1877F2"
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
                renderItem={({ item }) => (
                  <ShopCard
                    shop={item}
                    onPress={() => router.push({ pathname: '/Screens/User/BarberShopFeed', params: { shop_id: item._id } })}
                  />
                )}
                ListEmptyComponent={() => (
                  <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 }}>
                    <Ionicons name="search-outline" size={64} color="#BFDBFE" />
                    <Text style={{ marginTop: 16, fontSize: 16, textAlign: 'center', color: '#6B7280' }}>
                      No salons found for "{searchQuery}"
                    </Text>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </>
        ) : (
          <>
            {/* Services section */}
            <View style={{ marginVertical: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12, color: '#1877F2' }}>
                Services
              </Text>
              <ServiceFilter onServiceChange={handleServiceChange} />
            </View>

            {filterLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1877F2" />
                <Text style={{ marginTop: 12, color: '#1877F2', fontWeight: '500' }}>Filtering salons...</Text>
              </View>
            ) : (
              <>
                {activeShops.length > 0 && (
                  <ShopCarousel
                    title="Top Rated This Week"
                    shops={getPopularShops()}
                    onViewAll={() => router.push('/(tabs)/BookNow')}
                    onEndReached={loadMoreShops}
                    isLoadingMore={loadingMore}
                    hasMore={hasMoreShops}
                  />
                )}
                <PaisAdd />
                {/* <AdvancedFilter /> */}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;