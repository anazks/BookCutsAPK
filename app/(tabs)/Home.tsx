import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  BackHandler,
  RefreshControl,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { findNearestShops, search, filterShopsByService } from '../api/Service/Shop';
import { getmyProfile, getNearbyCitiesFallback } from '../api/Service/User';
import AdvancedFilter from '../Components/Filters/AdvancedFilter';
import PaisAdd from '../Components/Filters/PaisAdd';
import ServiceFilter from '../Components/Filters/ServiceFilter';
import BookingReminder from '../Components/Reminder/BookingReminder';
import ShopCard from '../Screens/User/ShopCard';
import ShopCarousel from '../Screens/User/ShopCarousel';

const Home = () => {
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

    const findNearestShopApi = async (page = 1, isLoadMore = false, isRefresh = false) => {
      if (coordinates.latitude === 0 && coordinates.longitude === 0) return;

      try {
        if (isRefresh) {
          setIsRefreshing(true);
          setCurrentPage(1);
        } else if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        
        const result = await findNearestShops({ 
          ...coordinates, 
          page, 
          limit: 10 
        });
        
        console.log('API Response:', result);

        if (result?.success) {
          if (isLoadMore) {
            // Append new shops for infinite scroll
            setShops(prev => [...prev, ...(result.shops || [])]);
          } else {
            // First load or refresh
            setShops(result.shops || []);
          }
          
          setTotalShops(result.total || result.shops?.length || 0);
          setHasMoreShops((result.shops || []).length === 10); // 10 items per page
          setError(null);
        } else {
          setError('Failed to fetch nearby shops.');
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        if (!isLoadMore) {
          setError('Failed to load shops. Check your connection.');
        }
      } finally {
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

    const loadMoreShops = () => {
      if (!loadingMore && hasMoreShops) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        findNearestShopApi(nextPage, true);
      }
    };



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
    <View style={{ flex: 1, backgroundColor: '#EEF4FF' }}>
      {/* ← very light blue tint for the page background */}
      <StatusBar barStyle="light-content" backgroundColor="#1877F2" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#1877F2',          // Facebook blue header
        paddingTop: 50,
        paddingBottom: 18,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#0D4FB5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>

          {/* City pill */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.18)',  // frosted white on blue
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
            onPress={() => setShowCityDropdown(true)}
          >
            <Ionicons name="location-sharp" size={16} color="#FFFFFF" />
            <Text style={{ marginLeft: 8, marginRight: 4, fontWeight: '600', color: '#FFFFFF' }}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderRadius: 20,
              padding: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 11,
          shadowColor: '#0D4FB5',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
        }}>
          <Ionicons name="search" size={20} color="#1877F2" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: '#111827' }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for salons, services, or styles..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchData([]); }}>
              <Ionicons name="close-circle" size={20} color="#1877F2" />
            </TouchableOpacity>
          )}
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
              borderBottomColor: '#DBEAFE',        // blue-tinted divider
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
            {error && (
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#DBEAFE',         // light blue error band
                margin: 16,
                padding: 12,
                borderRadius: 10,
                borderLeftWidth: 4,
                borderLeftColor: '#1877F2',
              }}>
                <Ionicons name="alert-circle-outline" size={20} color="#1877F2" />
                <Text style={{ flex: 1, marginLeft: 8, color: '#1D4ED8' }}>{error}</Text>
              </View>
            )}

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

            {/* Trending Styles */}
            {/* <View style={{ marginVertical: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1877F2' }}>Trending Styles</Text>
              </View>
              <FlatList
                horizontal
                data={trendingDesigns}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item }) => (
                  <View style={{
                    width: 140,
                    marginRight: 12,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 8,
                    shadowColor: '#1877F2',          // blue shadow for cards
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.12,
                    shadowRadius: 6,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: '#DBEAFE',           // subtle blue border
                  }}>
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 8 }}
                    />
                    <Text style={{ marginTop: 4, textAlign: 'center', fontWeight: '600', color: '#111827' }}>{item.name}</Text>
                    <Text style={{ marginTop: 2, textAlign: 'center', fontSize: 12, color: '#1877F2', fontWeight: '600' }}>
                      {item.popularity} popular
                    </Text>
                  </View>
                )}
              />
            </View> */}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;