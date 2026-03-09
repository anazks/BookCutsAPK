import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { filterShopsByService, findNearestShops, search } from '../api/Service/Shop';
import { getmyProfile } from '../api/Service/User';
import AdvancedFilter from '../Components/Filters/AdvancedFilter';
import PaisAdd from '../Components/Filters/PaisAdd';
import ServiceFilter from '../Components/Filters/ServiceFilter';
import BookingReminder from '../Components/Reminder/BookingReminder';
import ShopCard from '../Screens/User/ShopCard';
import ShopCarousel from '../Screens/User/ShopCarousel';

const { width, height } = Dimensions.get('window');

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

      setCoordinates({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
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
      const url = `http://gd.geobytes.com/GetNearbyCities?latitude=${lat}&longitude=${lon}&radius=120`;

      const res = await fetch(url);
      const text = await res.text();

      if (!text || text.trim() === '[[%s]]') return [];

      const data = JSON.parse(text);
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
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const sorted = citiesList.sort(
        (a: any, b: any) => distanceKm(lat, lon, a.lat, a.lon) - distanceKm(lat, lon, b.lat, b.lon)
      );

      setCities(sorted);
      return sorted;
    } catch (err) {
      console.error('Failed to fetch nearby cities:', err);
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

      if (result?.success) {
        if (isLoadMore) {
          setShops(prev => [...prev, ...(result.shops || [])]);
        } else {
          setShops(result.shops || []);
        }

        setTotalShops(result.total || result.shops?.length || 0);
        setHasMoreShops((result.shops || []).length === 10);
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
      if (response?.success) {
        setUserProfile(response.user);
      }
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
            await AsyncStorage.multiRemove(['accessToken', 'shopId']);
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            router.replace('/Screens/User/Login');
          } catch (error) {
            console.error('Logout Error:', error);
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

    if (serviceName === 'All' || !serviceName) {
      setFilteredShops([]);
      return;
    }

    if (!shops.length) {
      setFilteredShops([]);
      return;
    }

    try {
      setFilterLoading(true);
      const shopIds = shops.map((shop) => shop._id).filter(Boolean);

      const response = await filterShopsByService({
        shopIds,
        serviceName,
      });

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

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
      findNearestShopApi(1, false);
      getProfile();
      getNearByCities(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchData([]);
      setIsSearching(false);
      return;
    }

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, color: 'rgba(255,255,255,0.5)' }}>Finding nearest salons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND DECORATION */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020617' }]} />
        <LinearGradient
          colors={['#1E3A8A', 'transparent']}
          style={styles.bgGradientCircle}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.userNameText}>Hi, {userProfile?.firstName || 'Guest'} 👋</Text>
              <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => setShowCityDropdown(true)}
              >
                <Ionicons name="location" size={16} color="#3B82F6" />
                <Text style={styles.selectedCityText} numberOfLines={1}>{selectedCity}</Text>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <View style={styles.glassSearchBar}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search salons, styles or services..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchData([]); }}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
          }
        >
          {searchQuery.length > 0 ? (
            <View style={styles.searchResultSection}>
              {isSearching ? (
                <View style={styles.centerInfo}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : (
                <FlatList
                  data={searchData}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <ShopCard
                      shop={item}
                      onPress={() => router.push({
                        pathname: '/Screens/User/BarberShopFeed',
                        params: { shop_id: item._id }
                      })}
                    />
                  )}
                  ListEmptyComponent={() => (
                    <View style={styles.centerInfo}>
                      <Ionicons name="search-outline" size={60} color="rgba(255,255,255,0.1)" />
                      <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
                    </View>
                  )}
                />
              )}
            </View>
          ) : (
            <>
              <BookingReminder />

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* SERVICES */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Our Services</Text>
                <ServiceFilter onServiceChange={handleServiceChange} />
              </View>

              {filterLoading ? (
                <View style={styles.centerInfo}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : (
                <>
                  {activeShops.length > 0 && (
                    <View style={styles.carouselSection}>
                      <ShopCarousel
                        title="Top Rated This Week"
                        shops={getPopularShops()}
                        onViewAll={() => router.push('/(tabs)/BookNow')}
                        onEndReached={loadMoreShops}
                        isLoadingMore={loadingMore}
                        hasMore={hasMoreShops}
                      />
                    </View>
                  )}

                  <PaisAdd />
                  <AdvancedFilter />

                  {/* TRENDING */}
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Trending Styles</Text>
                    <FlatList
                      horizontal
                      data={trendingDesigns}
                      keyExtractor={(item) => item.id}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingLeft: 20 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.trendingCard}>
                          <Image source={{ uri: item.image }} style={styles.trendingImg} />
                          <LinearGradient
                            colors={['transparent', 'rgba(2, 6, 23, 0.95)']}
                            style={styles.trendingOverlay}
                          >
                            <Text style={styles.trendingName}>{item.name}</Text>
                            <Text style={styles.trendingStats}>{item.popularity} popular</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* CITY MODAL */}
      <Modal visible={showCityDropdown} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Location</Text>
              <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {cities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.cityRow}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons name="location-outline" size={20} color="#3B82F6" />
                  <Text style={styles.cityLabel}>{city.name}</Text>
                  {selectedCity === city.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// SAFETY WRAPPER FOR SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  loadingContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  bgGradientCircle: { position: 'absolute', top: -100, right: -50, width: 350, height: 350, borderRadius: 175, opacity: 0.25 },
  
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userNameText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  locationSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  selectedCityText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginHorizontal: 6, maxWidth: width * 0.6 },
  iconButton: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 12 },

  searchContainer: { marginTop: 25 },
  glassSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 58,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, marginLeft: 12, fontWeight: '500' },

  section: { marginTop: 30 },
  sectionHeader: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', paddingHorizontal: 20, marginBottom: 15, letterSpacing: -0.5 },
  
  centerInfo: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 15, fontSize: 15 },
  
  errorBanner: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', margin: 20, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  errorText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginLeft: 10 },

  carouselSection: { marginTop: 10 },

  trendingCard: { width: 170, height: 230, marginRight: 15, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0F172A' },
  trendingImg: { width: '100%', height: '100%' },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, height: '50%', justifyContent: 'flex-end' },
  trendingName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  trendingStats: { color: '#10B981', fontSize: 12, fontWeight: '600', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F172A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  cityLabel: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 15, fontWeight: '500' },
});

export default Home;