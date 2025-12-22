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
  View
} from 'react-native';

// Import the API service functions
import { findNearestShops } from '../api/Service/Shop';
import { getmyProfile } from '../api/Service/User';

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

  const cities = [
    'All Cities',
    'Kochi',
    'Salem',
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Hyderabad',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Lucknow',
    'Kanpur',
    'Nagpur',
    'Indore',
    'Thane',
    'Bhopal',
    'Visakhapatnam',
    'Pimpri-Chinchwad'
  ];

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
    setSelectedCity(city);
    setShowCityDropdown(false);
    // In a real app, you would make an API call to filter by this city
    console.log('Selected city:', city);
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
    { id: '1', name: 'Haircut', icon: 'cut', color: '#4A90E2' },
    { id: '2', name: 'Beard Trim', icon: 'leaf', color: '#50C878' },
    { id: '3', name: 'Hair Wash', icon: 'water', color: '#FF6B6B' },
    { id: '4', name: 'Styling', icon: 'brush', color: '#9B59B6' },
  ];

  const handleShopPress = (shop) => {
    console.log('Shop pressed:', shop);
    router.push({
      // pathname: '/Screens/User/BookNow',
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
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
              <Ionicons name="menu" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={() => setShowCityDropdown(true)}
            >
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{selectedCity}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNotificationsPress}
            >
              <Ionicons name="notifications-outline" size={24} color="#333" />
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
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
              {cities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cityItem,
                    selectedCity === city && styles.selectedCityItem
                  ]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons 
                    name="location-outline" 
                    size={20} 
                    color={selectedCity === city ? "#FF6B6B" : "#666"} 
                  />
                  <Text 
                    style={[
                      styles.cityItemText,
                      selectedCity === city && styles.selectedCityItemText
                    ]}
                  >
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Ionicons name="checkmark" size={20} color="#FF6B6B" />
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
                <Ionicons name="log-out-outline" size={48} color="#FF6B6B" />
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
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Hello, {userProfile ? userProfile.firstName : 'there'}! 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>Find the perfect salon for your style</Text>
          {getFilteredShops().length > 0 && (
            <Text style={styles.shopsCount}>
              {getFilteredShops().length} shops available in {selectedCity}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.searchContainer}
          onPress={handleSearchPress}
        >
          <View style={styles.searchContent}>
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchText}>Search salons, services, or styles...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

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

        {getFilteredShops().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Near You</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => handleSeeAllPress('popular')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={getPopularShops()}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalListContainer}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.shopCard}
                  onPress={() => handleShopPress(item)}
                >
                  <View style={styles.shopImageContainer}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.shopImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{item.distance}</Text>
                    </View>
                  </View>
                  <View style={styles.shopDetails}>
                    <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.ratingPriceContainer}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
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

        {getFilteredShops().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Rated This Week</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => handleSeeAllPress('top-rated')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#FF6B6B" />
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
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.shopImage} 
                      resizeMode="cover"
                    />
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
                        <Ionicons name="star" size={14} color="#FFD700" />
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
                <TouchableOpacity 
                  style={styles.shopCard}
                  onPress={() => handleShopPress(item)}
                >
                  <View style={styles.shopImageContainer}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.shopImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{item.distance}</Text>
                    </View>
                  </View>
                  <View style={styles.shopDetails}>
                    <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.ratingPriceContainer}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Styles</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/Screens/User/TrendingStyles')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#FF6B6B" />
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
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.designImage} 
                    resizeMode="cover"
                  />
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    color: '#666',
    fontWeight: '500',
  },
  navContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    marginRight: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginHorizontal: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    marginRight: 12,
  },
  notificationButton: {
    marginRight: 12,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  profileButton: {
    marginLeft: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityDropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cityDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  cityDropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
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
    borderBottomColor: '#F0F0F0',
  },
  selectedCityItem: {
    backgroundColor: '#FFF5F5',
  },
  cityItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  selectedCityItemText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  logoutModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutIcon: {
    marginBottom: 20,
  },
  logoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  logoutMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  logoutButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  shopsCount: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
    marginTop: 4,
  },
  shopsCountSmall: {
    fontSize: 12,
    color: '#999',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchText: {
    marginLeft: 12,
    color: '#999',
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
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
  },
  retryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  topRatedCard: {
    borderWidth: 1,
    borderColor: '#FFD700',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    backgroundColor: '#FFD700',
    padding: 6,
    borderRadius: 12,
  },
  shopDetails: {
    padding: 16,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
    color: '#666',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  servicesText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '400',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: 'rgba(255,107,107,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularityText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  designName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  specialOfferContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  specialOffer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  offerContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  offerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  offerTextContainer: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  offerCode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  bottomSpacing: {
    height: 60,
  },
});

export default Home;