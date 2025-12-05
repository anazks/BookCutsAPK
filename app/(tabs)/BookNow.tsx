import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllShops } from '../api/Service/Shop';

// Color palette
const colors = {
  primary: '#6366f1',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  background: '#fafafa',
  surface: '#ffffff',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    light: '#9ca3af',
  },
  border: '#e5e7eb',
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const BookNow = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedCity, setSelectedCity] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [allShops, setAllShops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleCardPress = (shop) => {
    console.log('Card pressed:', shop);
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id }
    });
  };

  const handleBooking = (shop) => {
    console.log('Book button pressed:', shop);
    router.push({
      pathname: '/Screens/User/BookNow',
      params: { shop_id: shop.id }
    });
  };
  
  // Transform API data to match our component structure
  const transformShopData = (apiData) => {
    return apiData.map((shop, index) => {
      // Handle different data structures in the API response
      const shopName = shop.ShopName || `${shop.firstName} ${shop.lastName}` || 'Unknown Shop';
      const city = shop.City || shop.city || 'Unknown City';
      const mobile = shop.Mobile || shop.mobileNo || 'N/A';
      const timing = shop.Timing || '9:00 AM - 8:00 PM';
      const website = shop.website || '';
      
      return {
        id: shop._id,
        name: shopName,
        rating: 4.0 + (Math.random() * 1), // Random rating between 4.0-5.0
        reviews: Math.floor(Math.random() * 200) + 50,
        city: city,
        mobile: mobile,
        timing: timing,
        website: website,
        price: '₹500-1500',
        coordinates: shop.ExactLocationCoord ? shop.ExactLocationCoord.coordinates : null,
        image: shop.ProfileImage || `https://images.unsplash.com/photo-${1580618672591 + index}-eb180b1a973f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60`,
        isOpen: Math.random() > 0.3,
        discount: Math.random() > 0.6 ? `${Math.floor(Math.random() * 20) + 10}% OFF` : null,
        serviceType: 'Barber Shop',
      };
    });
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllShops();
      
      if (result && result.success) {
        const transformedData = result.data ? transformShopData(result.data) : [];
        setAllShops(transformedData);
      } else {
        setError(result.message || 'Failed to fetch shops');
        console.log("Error fetching shops:", result);
      }
    } catch (error) {
      setError('Network error occurred');
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    })();
  }, []);

  // Get unique cities from the data (case-insensitive)
  const getUniqueCities = useMemo(() => {
    const cityMap = new Map();
    allShops.forEach(shop => {
      const trimmed = shop.city.trim();
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        if (!cityMap.has(lower)) {
          cityMap.set(lower, trimmed);
        }
      }
    });
    return Array.from(cityMap.values()).sort();
  }, [allShops]);
  
  const cities = useMemo(() => ['All', ...getUniqueCities], [getUniqueCities]);

  const shopsWithDistance = useMemo(() => {
    if (!userLocation || !allShops.length) {
      return allShops.map(shop => ({
        ...shop,
        distance: 'N/A',
        distanceKm: Infinity
      }));
    }

    const userLat = userLocation.coords.latitude;
    const userLon = userLocation.coords.longitude;

    return allShops.map(shop => {
      if (!shop.coordinates || shop.coordinates.length < 2) {
        return {
          ...shop,
          distance: 'N/A',
          distanceKm: Infinity
        };
      }

      const shopLat = shop.coordinates[1];
      const shopLon = shop.coordinates[0];
      const distanceKm = calculateDistance(userLat, userLon, shopLat, shopLon);

      return {
        ...shop,
        distance: `${distanceKm.toFixed(1)} km`,
        distanceKm
      };
    });
  }, [userLocation, allShops]);
  
  const sortOptions = [
    { key: 'name', label: 'Name A-Z', icon: 'text-outline' },
    { key: 'distance', label: 'Nearest First', icon: 'location-outline' },
  ];

  // Filter and sort shops
  const filteredAndSortedShops = useMemo(() => {
    let filtered = shopsWithDistance.filter(shop => {
      const cityMatch = selectedCity === 'All' || shop.city === selectedCity;
      const searchMatch = !searchQuery || 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        shop.city.toLowerCase().includes(searchQuery.toLowerCase());
      return cityMatch && searchMatch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'distance':
          return a.distanceKm - b.distanceKm;
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCity, sortBy, shopsWithDistance, searchQuery]);

  const renderShopCard = ({ item }) => (
    <TouchableOpacity style={styles.shopCard} activeOpacity={0.8} onPress={() => handleCardPress(item)}>
      <View style={styles.shopImageContainer}>
        <Image source={{ uri: item.image }} style={styles.shopImage} />
      </View>

      <View style={styles.shopInfo}>
        {/* Header: Name and Service Type */}
        <View style={styles.shopHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceText}>{item.serviceType}</Text>
          </View>
        </View>

        {/* Rating and Distance Row - Secondary Hierarchy */}
        <View style={styles.ratingDistanceRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={colors.accent} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({item.reviews})</Text>
          </View>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>

        {/* Location and Timing Row */}
        <View style={styles.cityTimeRow}>
          <View style={styles.cityContainer}>
            <Ionicons name="business-outline" size={14} color={colors.primary} />
            <Text style={styles.cityText}>{item.city}</Text>
          </View>
          <Text style={styles.timeText}>{item.timing}</Text>
        </View>

        {/* Contact Row */}
        <View style={styles.contactRow}>
          <View style={styles.phoneContainer}>
            <Ionicons name="call-outline" size={14} color={colors.secondary} />
            <Text style={styles.phoneText}>{item.mobile}</Text>
          </View>
        </View>

        {/* Bottom Row: Full-width CTA */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.bookButton} onPress={() => handleBooking(item)}>
            <Text style={styles.bookButtonText}>Book Service</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.text.light} />
      <Text style={styles.emptyTitle}>No barber shops found</Text>
      <Text style={styles.emptyText}>Try adjusting your filters or search criteria</Text>
    </View>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptionsRow}>
                {cities.map((city, index) => (
                  <TouchableOpacity
                    key={`${city}-${index}`}
                    style={[
                      styles.filterOption,
                      selectedCity === city && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowFilters(false);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCity === city && styles.filterOptionTextActive
                    ]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sortModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.sortOptionsContainer}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortModal(false);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={sortBy === option.key ? colors.primary : colors.text.secondary} 
                />
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Barber Shops ...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Ionicons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchShops}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      {/* Header with Search Bar and Filter/Sort Buttons */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search barber shops..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.light}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsText}>
          {filteredAndSortedShops.length} barber shops found
        </Text>
      </View>

      {/* Shop List */}
      <FlatList
        data={filteredAndSortedShops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shopList}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={loading}
        onRefresh={fetchShops}
      />

      <FilterModal />
      <SortModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  clearSearch: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  shopList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Added padding to prevent overlap with bottom navigation bar
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 160, // Slightly reduced height for compactness
    backgroundColor: colors.border,
  },
  shopInfo: {
    padding: 12, // Reduced padding for less vertical space
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8, // Reduced margin
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700', // Bolder for primary hierarchy
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  serviceBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  ratingDistanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  cityTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  contactRow: {
    marginBottom: 12, // Reduced margin
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Full width for attractiveness
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  sortModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  filterOption: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  filterOptionTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  sortOptionsContainer: {
    paddingHorizontal: 20,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: colors.primary + '10',
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default BookNow;