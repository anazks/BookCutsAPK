import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { findNearestShops, search } from '../api/Service/Shop';
import { getmyProfile } from '../api/Service/User';
import AdvancedFilter from '../Components/Filters/AdvancedFilter';
import PaisAdd from '../Components/Filters/PaisAdd';
import ServiceFilter from '../Components/Filters/ServiceFilter';
import BookingReminder from '../Components/Reminder/BookingReminder';
import ShopCard from '../Screens/User/ShopCard';

const Home = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState('India');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [coordinates, setCoordinates] = useState({
    latitude: 0,
    longtitude: 0
  });

  const [cities, setCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow location access in settings.");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

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
        longtitude: loc.coords.longitude
      });

    } catch (error) {
      console.error("Error getting location:", error);
      setError("Failed to get your location. Please check your settings.");
      setLoading(false);
    }
  };

  const getNearByCities = async ({ latitude, longtitude }) => {
    try {
      const lat = Number(latitude.toFixed(4));
      const lon = Number(longtitude.toFixed(4));

      const url = `http://gd.geobytes.com/GetNearbyCities?latitude=${lat}&longitude=${lon}&radius=120`;

      const res = await fetch(url);
      const text = await res.text();

      if (!text || text.trim() === "[[%s]]") {
        return [];
      }

      const data = JSON.parse(text);

      const cities = data.map(item => ({
        name: item[1],
        lat: Number(item[8]),
        lon: Number(item[10])
      }));

      const toRad = deg => (deg * Math.PI) / 180;

      const distanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;

        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const sorted = cities.sort(
        (a, b) =>
          distanceKm(lat, lon, a.lat, a.lon) -
          distanceKm(lat, lon, b.lat, b.lon)
      );

      setCities(sorted);
      return sorted;

    } catch (err) {
      console.error("Failed to fetch nearby cities:", err);
      return [];
    }
  };

  const findNearestShopApi = async () => {
    if (coordinates.latitude === 0 && coordinates.longtitude === 0) {
      return;
    }

    try {
      setLoading(true);
      const result = await findNearestShops(coordinates);
      
      if (result && result.success) {
        setShops(result.shops);
        setError(null);
      } else {
        setError("Failed to fetch nearby shops. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching nearby shops:", error);
      setError("Failed to load shops. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async () => {
    if (coordinates.latitude === 0 && coordinates.longtitude === 0) {
      return;
    }
    
    try {
      const response = await getmyProfile(coordinates);
      if (response && response.success) {
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
        {
          text: "Cancel",
          style: "cancel"
        },
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

    setCoordinates({
      latitude: Number(city.lat),
      longtitude: Number(city.lon),
    });

    setShowCityDropdown(false);
  };

  const handleRefresh = () => {
    getLocation();
  };

  const handleSearchPress = () => {
    router.push('/Screens/User/Search');
  };

  const handleSeeAllPress = (section) => {
    router.push({
      pathname: '/Screens/User/SeeAllShops',
      params: { section, city: selectedCity }
    });
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longtitude !== 0) {
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

    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const response = await search(query.trim()); 
      
      if (response && response.shops) {
        setSearchData(response.shops); 
      } else {
        setSearchData([]);
      }
    } catch (error) {
      console.error("Search API Error:", error);
      setSearchData([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getFilteredShops = () => {
    if (selectedCity === 'All Cities' || selectedCity === 'India') {
      return shops;
    }

    return shops.filter(shop =>
      shop.City?.toLowerCase().includes(selectedCity.toLowerCase()) ||
      shop.city?.toLowerCase().includes(selectedCity.toLowerCase())
    );
  };

  const transformShopData = (apiShops) => {
    return apiShops.map((shop) => {
      let shopName = 'Unknown Shop';

      if (shop.ShopName && shop.ShopName.trim()) {
        shopName = shop.ShopName.trim();
      }

      let imageUrl = shop.ProfileImage;
      if (!imageUrl && shop.media && Array.isArray(shop.media) && shop.media.length > 0) {
        const firstMedia = shop.media[0];
        imageUrl = typeof firstMedia === 'string' ? firstMedia : firstMedia?.url;
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

  const getPopularShops = () => {
    const filteredShops = getFilteredShops();
    const sortedByDistance = [...filteredShops].sort((a, b) => a.distance - b.distance);
    const transformedShops = transformShopData(sortedByDistance);
    return transformedShops.slice(0, 8);
  };

  const getTopRatedShops = () => {
    const filteredShops = getFilteredShops();
    const transformedShops = transformShopData(filteredShops);
    return transformedShops.slice(0, Math.min(8, transformedShops.length));
  };

  const getAllTransformedShops = () => {
    const filteredShops = getFilteredShops();
    return transformShopData(filteredShops);
  };

  const trendingDesigns = [
    {
      id: '1',
      name: 'Fade Cut',
      popularity: '92%',
      image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZmFkZSUyMGhhaXJjdXQlMjBtZW58ZW58MHx8MHx8fDA%3D'
    },
    {
      id: '2',
      name: 'Pompadour',
      popularity: '87%',
      image: 'https://images.unsplash.com/photo-1594910344569-a542a5f4bdff?fm=jpg&q=60&w=500&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9tcGFkb3VyJTIwaGFpcmN1dCUyMG1lbnxlbnwwfHwwfHx8MA%3D%3D'
    },
    {
      id: '3',
      name: 'Undercut',
      popularity: '89%',
      image: 'https://plus.unsplash.com/premium_photo-1741585389812-0a38dc258c62?fm=jpg&q=60&w=500&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dW5kZXJjdXQlMjBoYWlyY3V0JTIwbWVufGVufDB8fDB8fHww'
    },
  ]; 

  const handleShopPress = (shop) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id }
    });
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchData([]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Flat Zomato-style Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Location Section */}
          <TouchableOpacity 
            style={styles.locationContainer}
            onPress={() => setShowCityDropdown(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={16} color="#EF4444" />
            <Text style={styles.cityText}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={14} color="#4B5563" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchContent}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for salons, services, or styles..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleResetSearch}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <BookingReminder/>
      
      {/* City Dropdown Modal */}
      <Modal
        visible={showCityDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCityDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityDropdown(false)}
        >
          <View style={styles.cityDropdownContainer}>
            <View style={styles.cityDropdownHeader}>
              <Text style={styles.cityDropdownTitle}>Select Your Location</Text>
              <TouchableOpacity 
                onPress={() => setShowCityDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
              {cities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cityItem,
                    selectedCity === city.name && styles.selectedCityItem
                  ]}
                  onPress={() => handleCitySelect(city)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="location-outline" 
                    size={20} 
                    color={selectedCity === city.name ? "#EF4444" : "#9CA3AF"} 
                  />
                  <Text style={[
                    styles.cityItemText,
                    selectedCity === city.name && styles.selectedCityItemText
                  ]}>
                    {city.name}
                  </Text>
                  {selectedCity === city.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searchQuery.length > 0 ? (
          <View style={{ flex: 1 }}>
            {isSearching ? (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.searchingText}>Searching salons...</Text>
              </View>
            ) : (
              <FlatList
                data={searchData}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <ShopCard
                    shop={item}
                    onPress={() => handleShopPress({ id: item._id })}
                  />
                )}
                ListEmptyComponent={() => (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.noResultsTitle}>
                      No salons found for "{searchQuery}"
                    </Text>
                    <Text style={styles.noResultsSubtitle}>
                      Try searching with different keywords
                    </Text>
                  </View>
                )}
                contentContainerStyle={styles.searchResultsContainer}
              />
            )}
          </View>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Service Filters */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Services</Text>
              </View>
              <View style={styles.quickServicesContainer}>
                <ServiceFilter/>
              </View>
            </View>

            {/* Top Rated Shops */}
            {getFilteredShops().length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top Rated This Week</Text>
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => handleSeeAllPress('top-rated')}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                    <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={getTopRatedShops()}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.horizontalListContainer}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.shopCard}
                      onPress={() => handleShopPress(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.shopImageContainer}>
                        <Image source={{ uri: item.image }} style={styles.shopImage} resizeMode="cover" />
                        <View style={styles.topRatedBadge}>
                          <Ionicons name="trophy" size={12} color="#FFF" />
                          <Text style={styles.topRatedText}>TOP</Text>
                        </View>
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{item.distance}</Text>
                        </View>
                      </View>
                      <View style={styles.shopDetails}>
                        <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.shopServices} numberOfLines={1}>{item.services}</Text>
                        <View style={styles.shopFooter}>
                          <Text style={styles.shopPrice}>{item.price}</Text>
                          <Text style={styles.shopCity}>{item.city}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* All Available Shops */}
            {getFilteredShops().length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>All Available Shops</Text>
                  <Text style={styles.shopsCount}>({getFilteredShops().length})</Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={getAllTransformedShops()}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.horizontalListContainer}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.shopCard} 
                      onPress={() => handleShopPress(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.shopImageContainer}>
                        <Image source={{ uri: item.image }} style={styles.shopImage} resizeMode="cover" />
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{item.distance}</Text>
                        </View>
                      </View>
                      <View style={styles.shopDetails}>
                        <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.shopServices} numberOfLines={1}>{item.services}</Text>
                        <View style={styles.shopFooter}>
                          <Text style={styles.shopPrice}>{item.price}</Text>
                          <Text style={styles.shopCity}>{item.city}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
              <View style={styles.advancedFilterSection}>
              <PaisAdd/>
            </View>
            {/* Trending Styles */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending Styles</Text>
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => router.push('/Screens/User/TrendingStyles')}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={trendingDesigns}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.horizontalListContainer}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.designCard} activeOpacity={0.8}>
                    <View style={styles.designImageContainer}>
                      <Image source={{ uri: item.image }} style={styles.designImage} resizeMode="cover" />
                      <View style={styles.popularityBadge}>
                        <Text style={styles.popularityText}>{item.popularity}</Text>
                      </View>
                    </View>
                    <Text style={styles.designName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          

            {/* Advanced Filter - Always shown at the bottom */}
           

            {/* Additional bottom padding for scroll */}
            <View style={styles.bottomPadding} />
          </>
        )}
              <AdvancedFilter/>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  // Flat Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    marginRight: 4,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Search Bar
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  // Advanced Filter Section
  advancedFilterSection: {
  
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityDropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cityDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cityDropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  cityList: {
    maxHeight: 400,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedCityItem: {
    backgroundColor: '#FEF2F2',
  },
  cityItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
  },
  selectedCityItemText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  // Main Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to ensure content is scrollable
  },
  // Search Results
  searchingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  searchingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  noResultsContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  noResultsSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#991B1B',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  retryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Sections
  section: {
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  shopsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  quickServicesContainer: {
    paddingHorizontal: 8,
  },
  // Horizontal Lists
  horizontalListContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  // Shop Card - Plain without shadow
  shopCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  topRatedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topRatedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '500',
  },
  shopDetails: {
    padding: 8,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  shopServices: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  shopCity: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  // Design Card - Plain without shadow
  designCard: {
    width: 140,
    marginRight: 12,
  },
  designImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  designImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  popularityBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  designName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#374151',
  },
  bottomPadding: {
    height: 40, // Extra padding at the bottom for scroll
  },
});

export default Home;