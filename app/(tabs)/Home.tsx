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
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { filterShopsByService, findNearestShops, search } from '../api/Service/Shop';
import { getmyProfile } from '../api/Service/User';
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

  // Pagination states
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
      
      console.log('API Response:', result);

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
        image: imageUrl || 'https://via.placeholder.com/300x200/1A1A1A/D4AF37?text=Shop',
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
    {
      id: '1',
      name: 'Fade Cut',
      popularity: '92%',
      image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500',
    },
    {
      id: '2',
      name: 'Pompadour',
      popularity: '87%',
      image: 'https://images.unsplash.com/photo-1594910344569-a542a5f4bdff?fm=jpg&q=60&w=500',
    },
    {
      id: '3',
      name: 'Undercut',
      popularity: '89%',
      image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500',
    },
  ];

  if (loading && shops.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{ marginTop: 16, color: '#D4AF37', fontSize: 14, letterSpacing: 1 }}>LOADING...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A']}
        style={{
          paddingTop: 50,
          paddingBottom: 30,
          paddingHorizontal: 20,
        }}
      >
        {/* Top Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
            onPress={() => setShowCityDropdown(true)}
          >
            <Ionicons name="location-sharp" size={16} color="#D4AF37" />
            <Text style={{ marginLeft: 8, marginRight: 4, fontWeight: '600', color: '#D4AF37', fontSize: 13 }}>
              {selectedCity}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#D4AF37" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: 'rgba(212, 175, 55, 0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>
            DISCOVER • BOOK • EXPERIENCE
          </Text>
          <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            Find Your Style
          </Text>
        </View>

        {/* Premium Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.2)',
          }}
        >
          <Ionicons name="search" size={20} color="rgba(212, 175, 55, 0.6)" />
          <TextInput
            style={{ flex: 1, marginLeft: 12, fontSize: 14, color: '#FFF' }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search shops or services..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchData([]); }}>
              <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <BookingReminder />

      {/* Premium City Selection Modal */}
      <Modal 
        visible={showCityDropdown} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowCityDropdown(false)}
      >
        <TouchableOpacity
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.85)', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
          activeOpacity={1}
          onPress={() => setShowCityDropdown(false)}
        >
          <View style={{ 
            backgroundColor: '#1A1A1A', 
            borderRadius: 16, 
            width: '90%', 
            maxHeight: '70%', 
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.3)',
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              padding: 20, 
              borderBottomWidth: 1, 
              borderBottomColor: 'rgba(255, 255, 255, 0.1)' 
            }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>Select Location</Text>
                <Text style={{ fontSize: 11, color: 'rgba(212, 175, 55, 0.8)', marginTop: 2, letterSpacing: 1 }}>
                  NEARBY CITIES
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                <Ionicons name="close" size={24} color="#D4AF37" />
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
                    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                    backgroundColor: selectedCity === city.name ? 'rgba(212, 175, 55, 0.1)' : 'transparent'
                  }}
                  onPress={() => handleCitySelect(city)}
                >
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: selectedCity === city.name ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Ionicons 
                      name="location-outline" 
                      size={18} 
                      color={selectedCity === city.name ? '#D4AF37' : 'rgba(255, 255, 255, 0.4)'} 
                    />
                  </View>
                  <Text style={{ 
                    flex: 1, 
                    marginLeft: 12, 
                    color: selectedCity === city.name ? '#D4AF37' : '#FFF',
                    fontWeight: selectedCity === city.name ? '600' : '400'
                  }}>
                    {city.name}
                  </Text>
                  {selectedCity === city.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {searchQuery.length > 0 ? (
          <>
            {isSearching ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={{ marginTop: 16, color: 'rgba(212, 175, 55, 0.8)', fontSize: 13, letterSpacing: 1 }}>
                  SEARCHING...
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchData}
                keyExtractor={(item) => item._id}
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
                  <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 }}>
                    <Ionicons name="search-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
                    <Text style={{ marginTop: 16, fontSize: 16, textAlign: 'center', color: '#FFF', fontWeight: '600' }}>
                      No Results Found
                    </Text>
                    <Text style={{ marginTop: 8, fontSize: 13, textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Try searching for "{searchQuery}" in a different city
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
                backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                margin: 16, 
                padding: 12, 
                borderRadius: 12, 
                borderLeftWidth: 3, 
                borderLeftColor: '#D4AF37',
                borderWidth: 1,
                borderColor: 'rgba(212, 175, 55, 0.3)'
              }}>
                <Ionicons name="alert-circle-outline" size={20} color="#D4AF37" />
                <Text style={{ flex: 1, marginLeft: 8, color: 'rgba(255, 255, 255, 0.8)' }}>{error}</Text>
              </View>
            )}

            {/* Services Section */}
            <View style={{ marginVertical: 20 }}>
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF' }}>Services</Text>
                <Text style={{ fontSize: 11, color: 'rgba(212, 175, 55, 0.8)', marginTop: 2, letterSpacing: 1 }}>
                  SELECT YOUR PREFERENCE
                </Text>
              </View>
              <ServiceFilter onServiceChange={handleServiceChange} />
            </View>

            {filterLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={{ marginTop: 12, color: 'rgba(212, 175, 55, 0.8)', fontSize: 13, letterSpacing: 1 }}>
                  FILTERING...
                </Text>
              </View>
            ) : (
              <>
                {activeShops.length > 0 && (
                  <ShopCarousel
                    title="Top Rated Near You"
                    shops={getPopularShops()}
                    onViewAll={() => router.push('/(tabs)/BookNow')}
                    onEndReached={loadMoreShops}
                    isLoadingMore={loadingMore}
                    hasMore={hasMoreShops}
                  />
                )}

                {/* Stats Section */}
               

                <PaisAdd />
                {/* <AdvancedFilter /> */}
              </>
            )}

            {/* Trending Styles */}
            <View style={{ marginVertical: 24 }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                paddingHorizontal: 20, 
                marginBottom: 16 
              }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF' }}>Trending Styles</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(212, 175, 55, 0.8)', marginTop: 2, letterSpacing: 1 }}>
                    POPULAR THIS WEEK
                  </Text>
                </View>
              </View>
              <FlatList
                horizontal
                data={trendingDesigns}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={{ 
                      width: 150, 
                      marginRight: 16, 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: 12, 
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Image 
                      source={{ uri: item.image }} 
                      style={{ 
                        width: '100%', 
                        height: 150, 
                      }} 
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                      }}
                    />
                    <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                      <Text style={{ 
                        color: '#FFF', 
                        fontWeight: '700', 
                        fontSize: 14,
                        marginBottom: 4
                      }}>
                        {item.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="trending-up" size={12} color="#D4AF37" />
                        <Text style={{ 
                          color: '#D4AF37', 
                          fontSize: 11, 
                          marginLeft: 4,
                          fontWeight: '600'
                        }}>
                          {item.popularity}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;