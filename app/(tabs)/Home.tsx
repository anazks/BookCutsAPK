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
  TouchableOpacity,
  View,
  TextInput
} from 'react-native';

// Import the API service functions
import { findNearestShops,search } from '../api/Service/Shop';
import { getmyProfile } from '../api/Service/User';
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
      console.log("Current Location:", loc.coords);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        setAddress(addr);
        const locality = addr.city || addr.subregion || 'India';
        console.log("Locality:", locality);
        setSelectedCity(locality);
        console.log("Address:", addr);
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

    console.log("URL >>>", url);

    const res = await fetch(url);
    const text = await res.text();

    console.log("RAW RESPONSE >>>", text);

    // handle empty / invalid result
    if (!text || text.trim() === "[[%s]]") {
      console.log("No nearby cities returned");
      return [];
    }

    // ✅ convert string → JSON array
    const data = JSON.parse(text);

    // ✅ extract only required fields
    const cities = data.map(item => ({
      name: item[1],
      lat: Number(item[8]),
      lon: Number(item[10])
    }));

    // ---- distance helpers ----
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

    // ---- sort nearest first ----
    const sorted = cities.sort(
  (a, b) =>
    distanceKm(lat, lon, a.lat, a.lon) -
    distanceKm(lat, lon, b.lat, b.lon)
);

console.log("Nearby Cities (sorted):", sorted);

// ✅ update dropdown city list here
setCities(sorted);

return sorted;


  } catch (err) {
    console.error("Failed to fetch nearby cities:", err);
    return [];
  }
};



  const findNearestShopApi = async () => {
    if (coordinates.latitude === 0 && coordinates.longtitude === 0) {
      console.log("Coordinates not available yet. Skipping API call.");
      return;
    }

    try {
      setLoading(true);
      const result = await findNearestShops(coordinates);
      console.log("Nearby shops API response:",JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        setShops(result.shops);
        setError(null);
      } else {
        console.log("Error fetching nearby shops:", result);
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
      console.log("User Profile Response:", response);
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
            // Remove accessToken + shopId
            await AsyncStorage.multiRemove(['accessToken', 'shopId']);

            // Redirect after removing token
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

  // Store city name for UI
  setSelectedCity(city.name);

  // Update coordinates (this will trigger your useEffect API call)
  setCoordinates({
    latitude: Number(city.lat),
    longtitude: Number(city.lon),
  });

  // Close dropdown
  setShowCityDropdown(false);

  console.log(
    "Selected city:",
    city.name,
    city.lat,
    city.lon
  );
};



  const handleRefresh = () => {
    getLocation(); // This will trigger the useEffect to refetch shops
  };

  const handleSearchPress = () => {
    router.push('/Screens/User/Search');
  };

  const handleNotificationsPress = () => {
    router.push('/Screens/User/Notifications');
  };

  const handleProfilePress = () => {
    router.push('/Screens/User/Profile');
  };

  const handleSeeAllPress = (section) => {
    router.push({
      pathname: '/Screens/User/SeeAllShops',
      params: { section, city: selectedCity }
    });
  };

  // 1. Get location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  // 2. Call APIs when coordinates are available
  useEffect(() => {
    if (coordinates.latitude !== 0 && coordinates.longtitude !== 0) {
      findNearestShopApi();
      getProfile();
      getNearByCities(coordinates); 
    }
  }, [coordinates]);


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
        rating: '4.5',
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

  const quickServices = [
    { id: '1', name: 'Haircut', icon: 'cut', color: '#4F46E5' },
    { id: '2', name: 'Beard Trim', icon: 'leaf', color: '#10B981' },
    { id: '3', name: 'Hair Wash', icon: 'water', color: '#3B82F6' },
    { id: '4', name: 'Styling', icon: 'brush', color: '#8B5CF6' },
  ];

  const handleShopPress = (shop) => {
    console.log('Shop pressed:', shop);
    router.push({
      // pathname: '/Screens/User/BookNow',
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id }
    });
  };
  
const [searchQuery, setSearchQuery] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- SEARCH LOGIC (DEBOUNCED) ---
  useEffect(() => {
    // If the user clears the input, clear the results immediately
    if (searchQuery.trim() === '') {
      setSearchData([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 500); // 500ms pause before API call

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

const performSearch = async (query) => {
  setIsSearching(true);
  try {
    // .trim() removes the extra space that caused your 404 log
    const response = await search(query.trim()); 
    
    console.log("Full Data:", response); 

    // Look closely at your log: the array is in response.nearByshops
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

  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchData([]);
    // Keyboard.dismiss();
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
      
      <View style={styles.navContainer}>
        <View style={styles.navContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons name="menu" size={24} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={() => setShowCityDropdown(true)}
            >
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.locationText}>{selectedCity}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh-outline" size={24} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNotificationsPress}
            >
              <Ionicons name="notifications-outline" size={24} color="#1E293B" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <Image 
                source={{ 
                  uri: userProfile?.profileImage || 'https://randomuser.me/api/portraits/men/1.jpg' 
                }} 
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
              <Text style={styles.cityDropdownTitle}>Select City</Text>
              <TouchableOpacity 
                onPress={() => setShowCityDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
             {cities.map((city, index) => (
  <TouchableOpacity
    key={index}
    style={[
      styles.cityItem,
      selectedCity?.name === city.name && styles.selectedCityItem
    ]}
    onPress={() => handleCitySelect(city)}
  >
    <Ionicons 
      name="location-outline" 
      size={20} 
      color={selectedCity?.name === city.name ? "#4F46E5" : "#64748B"} 
    />

    <Text style={[
      styles.cityItemText,
      selectedCity?.name === city.name && styles.selectedCityItemText
    ]}>
      {city.name}
    </Text>

    {selectedCity?.name === city.name && (
      <Ionicons name="checkmark" size={20} color="#4F46E5" />
    )}
  </TouchableOpacity>
))}

            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalContent}>
              <View style={styles.logoutIcon}>
                <Ionicons name="log-out-outline" size={48} color="#4F46E5" />
              </View>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutMessage}>
                Are you sure you want to logout from your account?
              </Text>
              <View style={styles.logoutButtonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
              <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
  {/* Welcome Section - Always visible */}
  <View style={styles.welcomeSection}>
    <Text style={styles.welcomeTitle}>
      Hello, {userProfile ? userProfile.firstName : 'there'}! 👋
    </Text>
    <Text style={styles.welcomeSubtitle}>Find the perfect salon for your style</Text>

    {/* Only show shop count when NOT searching */}
    {searchQuery.length === 0 && getFilteredShops().length > 0 && (
      <Text style={styles.shopsCount}>
        {getFilteredShops().length} shops available in {selectedCity}
      </Text>
    )}
  </View>

  {/* Search Bar - Always visible */}
  <View style={styles.searchContainer}>
    <View style={styles.searchContent}>
      {isSearching ? (
        <ActivityIndicator size="small" color="#4F46E5" style={{ marginRight: 4 }} />
      ) : (
        <Ionicons name="search" size={20} color="#64748B" />
      )}

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search salons, services, or styles..."
        placeholderTextColor="#64748B"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />

      {searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            setSearchQuery('');
            setSearchData([]);
            // Keyboard.dismiss();
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="close-circle" size={20} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>

    <TouchableOpacity style={styles.filterButton}>
      <Ionicons name="options-outline" size={20} color="#4F46E5" />
    </TouchableOpacity>
  </View>

  {/* ==================== SEARCH RESULTS (ONLY WHEN SEARCHING) ==================== */}
  {searchQuery.length > 0 && (
    <View style={{ flex: 1 }}>
      {/* Loading State */}
      {isSearching && (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#64748B' }}>
            Searching salons...
          </Text>
        </View>
      )}

      {/* Search Results List */}
      <FlatList
        data={searchData}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ShopCard
            shop={item}
            onPress={() => handleShopPress({ id: item._id })}
          />
        )}
        ListEmptyComponent={() =>
          !isSearching ? (
            <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 }}>
              <Ionicons name="search-outline" size={64} color="#CBD5E1" />
              <Text style={{ marginTop: 16, fontSize: 18, color: '#64748B', textAlign: 'center' }}>
                No salons found for "{searchQuery}"
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
                Try searching with different keywords
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )}

  {/* ==================== NORMAL HOME CONTENT (ONLY WHEN NOT SEARCHING) ==================== */}
  {searchQuery.length === 0 && (
    <>
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#4F46E5" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
        </View>
        <View style={styles.quickServicesContainer}>
          {quickServices.map((service) => (
            <TouchableOpacity key={service.id} style={styles.serviceCard}>
              <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                <Ionicons name={service.icon} size={24} color="#FFF" />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Top Rated This Week */}
      {getFilteredShops().length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated This Week</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => handleSeeAllPress('top-rated')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
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
                style={[styles.shopCard, styles.topRatedCard]}
                onPress={() => handleShopPress(item)}
              >
                <View style={styles.shopImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.shopImage} resizeMode="cover" />
                  <View style={styles.topRatedBadge}>
                    <Ionicons name="trophy" size={12} color="#FFF" />
                  </View>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{item.distance}</Text>
                  </View>
                </View>
                <View style={styles.shopDetails}>
                  <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.ratingPriceContainer}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>
                  <Text style={styles.servicesText} numberOfLines={1}>{item.services}</Text>
                  <Text style={styles.cityText} numberOfLines={1}>{item.city}</Text>
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
            <Text style={styles.shopsCountSmall}>({getFilteredShops().length} shops)</Text>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={getAllTransformedShops()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalListContainer}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.shopCard} onPress={() => handleShopPress(item)}>
                <View style={styles.shopImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.shopImage} resizeMode="cover" />
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{item.distance}</Text>
                  </View>
                </View>
                <View style={styles.shopDetails}>
                  <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.ratingPriceContainer}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>
                  <Text style={styles.servicesText} numberOfLines={1}>{item.services}</Text>
                  <Text style={styles.cityText} numberOfLines={1}>{item.city}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Trending Styles */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Styles</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => router.push('/Screens/User/TrendingStyles')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={trendingDesigns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.designCard}>
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

      <View style={styles.bottomSpacing} />
    </>
  )}
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
  navContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 1000,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginHorizontal: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    marginRight: 16,
  },
  notificationButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  profileButton: {
    marginLeft: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityDropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 24,
    maxHeight: '70%',
    width: '85%',
  },
  cityDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cityDropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedCityItem: {
    backgroundColor: '#F0F9FF',
  },
  cityItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#475569',
    fontWeight: '400',
  },
  selectedCityItemText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  logoutModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  logoutIcon: {
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  shopsCount: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 4,
  },
  shopsCountSmall: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchText: {
    marginLeft: 12,
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '400',
  },
  filterButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#64748B',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },
  retryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  quickServicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  serviceCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  horizontalListContainer: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  shopCard: {
    width: 220,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRatedCard: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 140,
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  topRatedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    padding: 6,
    borderRadius: 8,
  },
  shopDetails: {
    padding: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  ratingPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },
  servicesText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '400',
  },
  designCard: {
    width: 160,
    marginRight: 12,
  },
  designImageContainer: {
    position: 'relative',
  },
  designImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  popularityBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularityText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  designName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#475569',
  },
  bottomSpacing: {
    height: 80,
  },
});

export default Home;