import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router'
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
  BackHandler
} from 'react-native';

import { findNearestShops, search, filterShopsByService } from '../api/Service/Shop';
import { getmyProfile } from '../api/Service/User';
import AdvancedFilter from '../Components/Filters/AdvancedFilter';
import PaisAdd from '../Components/Filters/PaisAdd';
import ServiceFilter from '../Components/Filters/ServiceFilter';
import BookingReminder from '../Components/Reminder/BookingReminder';
import ShopCard from '../Screens/User/ShopCard';

const Home = () => {
  const [shops, setShops] = useState([]);                    // All nearby shops (original list)
  const [filteredShops, setFilteredShops] = useState([]);    // Shops after service filter
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Location & City states
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState('India');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [cities, setCities] = useState([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Service filter state
  const [selectedService, setSelectedService] = useState(null); // null = All

   useFocusEffect(
      React.useCallback(() => {
        const onBackPress = () => {
          Alert.alert("Exit App", "Are you sure you want to exit?", [
            { text: "Cancel", style: "cancel" },
            { text: "OK", onPress: () => BackHandler.exitApp() }
          ]);
          return true;
        };
  
        // 1. Capture the subscription in a variable
        const subscription = BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );
  
        // 2. Use .remove() in the cleanup function
        return () => subscription.remove(); 
        
      }, [])
    );

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow location access in settings.");
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
        longitude: loc.coords.longitude
      });
    } catch (error) {
      console.error("Error getting location:", error);
      setError("Failed to get your location. Please check your settings.");
      setLoading(false);
    }
  };

  const getNearByCities = async ({ latitude, longitude }) => {
    try {
      const lat = Number(latitude.toFixed(4));
      const lon = Number(longitude.toFixed(4));
      const url = `http://gd.geobytes.com/GetNearbyCities?latitude=${lat}&longitude=${lon}&radius=120`;

      const res = await fetch(url);
      const text = await res.text();

      if (!text || text.trim() === "[[%s]]") return [];

      const data = JSON.parse(text);
      const citiesList = data.map(item => ({
        name: item[1],
        lat: Number(item[8]),
        lon: Number(item[10])
      }));

      // Simple sort by distance
      const toRad = deg => (deg * Math.PI) / 180;
      const distanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const sorted = citiesList.sort((a, b) => distanceKm(lat, lon, a.lat, a.lon) - distanceKm(lat, lon, b.lat, b.lon));

      setCities(sorted);
      return sorted;
    } catch (err) {
      console.error("Failed to fetch nearby cities:", err);
      return [];
    }
  };

  const findNearestShopApi = async () => {
    if (coordinates.latitude === 0 && coordinates.longitude === 0) return;

    try {
      setLoading(true);
      const result = await findNearestShops(coordinates);
      if (result?.success) {
        setShops(result.shops || []);
        setError(null);
      } else {
        setError("Failed to fetch nearby shops.");
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      setError("Failed to load shops. Check your connection.");
    } finally {
      setLoading(false);
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
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['accessToken', 'shopId']);
              router.replace('/Screens/User/Login');
            } catch (error) {
              console.error("Logout Error:", error);
            }
          }
        }
      ]
    );
  };

  const handleCitySelect = (city) => {
    if (!city) return;
    setSelectedCity(city.name);
    setCoordinates({ latitude: Number(city.lat), longitude: Number(city.lon) });
    setShowCityDropdown(false);
  };

  const handleServiceChange = async (serviceName) => {
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

      const shopIds = shops.map(shop => shop._id).filter(Boolean);

      const response = await filterShopsByService({
        shopIds,
        serviceName
      });

      if (response?.success && response.shops) {
        setFilteredShops(response.shops);
      } else {
        setFilteredShops([]);
        Alert.alert("No Results", `No shops found offering "${serviceName}"`);
      }
    } catch (error) {
      console.error("Service filter error:", error);
      setFilteredShops([]);
    } finally {
      setFilterLoading(false);
    }
  };

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longitude !== 0) {
      findNearestShopApi();
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

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const response = await search(query.trim());
      setSearchData(response?.shops || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchData([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ── Data transformation helpers ────────────────────────────
  const transformShopData = (apiShops) => {
    return apiShops.map(shop => {
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
        services: 'Haircut, Beard, Styling',
        price: '$25-45',
        distance: `${(shop.distance / 1000).toFixed(1)} km`,
        city: shop.City || 'Unknown City',
        timing: shop.Timing || '9am - 8pm',
        mobile: shop.Mobile || '',
        website: shop.website || '',
        image: imageUrl || 'https://via.placeholder.com/300x200/FAFAFA/666666?text=Shop'
      };
    });
  };

  const activeShops = selectedService && selectedService !== 'All'
    ? filteredShops
    : shops;

  const transformedActiveShops = transformShopData(activeShops);

  const getPopularShops = () => {
    const sorted = [...activeShops].sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
    return transformShopData(sorted).slice(0, 8);
  };

  const getAllTransformedShops = () => {
    return transformShopData(activeShops);
  };

  const trendingDesigns = [
    { id: '1', name: 'Fade Cut', popularity: '92%', image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500' },
    { id: '2', name: 'Pompadour', popularity: '87%', image: 'https://images.unsplash.com/photo-1594910344569-a542a5f4bdff?fm=jpg&q=60&w=500' },
    { id: '3', name: 'Undercut', popularity: '89%', image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500' },
  ];

  const handleShopPress = (shop) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id }
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, color: '#64748B' }}>Loading shops...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={{ backgroundColor: '#FFF', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
            onPress={() => setShowCityDropdown(true)}
          >
            <Ionicons name="location-sharp" size={16} color="#EF4444" />
            <Text style={{ marginLeft: 8, marginRight: 4, fontWeight: '600' }}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={14} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 14 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for salons, services, or styles..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchData([]); }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <BookingReminder />

      {/* City selection modal */}
      <Modal visible={showCityDropdown} transparent animationType="fade" onRequestClose={() => setShowCityDropdown(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCityDropdown(false)}
        >
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, width: '90%', maxHeight: '70%', shadowColor: '#000', shadowOpacity: 0.25, elevation: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Select Your Location</Text>
              <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {cities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons name="location-outline" size={20} color={selectedCity === city.name ? "#EF4444" : "#9CA3AF"} />
                  <Text style={{ flex: 1, marginLeft: 12 }}>{city.name}</Text>
                  {selectedCity === city.name && <Ionicons name="checkmark-circle" size={20} color="#EF4444" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {searchQuery.length > 0 ? (
          <>
            {isSearching ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={{ marginTop: 16, color: '#6B7280' }}>Searching salons...</Text>
              </View>
            ) : (
              <FlatList
                data={searchData}
                keyExtractor={item => item._id}
                renderItem={({ item }) => <ShopCard shop={item} onPress={() => handleShopPress({ id: item._id })} />}
                ListEmptyComponent={() => (
                  <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 }}>
                    <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                    <Text style={{ marginTop: 16, fontSize: 16, textAlign: 'center' }}>
                      No salons found for "{searchQuery}"
                    </Text>
                  </View>
                )}
              />
            )}
          </>
        ) : (
          <>
            {error && (
              <View style={{ flexDirection: 'row', backgroundColor: '#FEF2F2', margin: 16, padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <Text style={{ flex: 1, marginLeft: 8 }}>{error}</Text>
              </View>
            )}

            {/* Services Filter */}
            <View style={{ marginVertical: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 }}>Services</Text>
              <ServiceFilter onServiceChange={handleServiceChange} />
            </View>

            {filterLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Filtering salons...</Text>
              </View>
            ) : (
              <>
                {/* Top Rated */}
                {activeShops.length > 0 && (
                  <View style={{ marginVertical: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700' }}>Top Rated This Week</Text>
                    </View>
                    <FlatList
                      horizontal
                      data={getPopularShops()}
                      keyExtractor={item => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{ width: 140, marginRight: 12, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}
                          onPress={() => handleShopPress(item)}
                        >
                          <Image source={{ uri: item.image }} style={{ width: '100%', height: 100 }} />
                          <View style={{ padding: 8 }}>
                            <Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={1}>{item.services}</Text>
                            <Text style={{ color: '#10B981', fontWeight: '600' }}>{item.price}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}

                {/* All Shops */}
                {activeShops.length > 0 && (
                  <View style={{ marginVertical: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 }}>
                      All Available Shops ({activeShops.length})
                    </Text>
                    <FlatList
                      horizontal
                      data={getAllTransformedShops()}
                      keyExtractor={item => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{ width: 140, marginRight: 12, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}
                          onPress={() => handleShopPress(item)}
                        >
                          <Image source={{ uri: item.image }} style={{ width: '100%', height: 100 }} />
                          <View style={{ padding: 8 }}>
                            <Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={1}>{item.services}</Text>
                            <Text style={{ color: '#10B981', fontWeight: '600' }}>{item.price}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}

                <PaisAdd />
                <AdvancedFilter />
              </>
            )}

            {/* Trending Styles */}
            <View style={{ marginVertical: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>Trending Styles</Text>
              </View>
              <FlatList
                horizontal
                data={trendingDesigns}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={{ width: 140, marginRight: 12 }}>
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: 140, borderRadius: 8 }} />
                    <Text style={{ marginTop: 6, textAlign: 'center', fontWeight: '500' }}>{item.name}</Text>
                  </View>
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