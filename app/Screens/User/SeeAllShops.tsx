import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import the API service function
import { getAllShops } from '../../api/Service/Shop';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Color palette
const colors = {
  primary: '#4F46E5',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    light: '#94A3B8',
  },
  border: '#E2E8F0',
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

const SeeAllShops = () => {
  const insets = useSafeAreaInsets();
  const [shops, setShops] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllShops();
      console.log("All shops API response:", result);
     
      if (result && result.success) {
        const shopsData = result.data || [];
        setShops(shopsData);
        setError(null);
      } else {
        console.log("Error fetching all shops:", result);
        setError("Failed to fetch all shops. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching all shops:", error);
      setError("Failed to load shops. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllShops();
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
    shops.forEach(shop => {
      const trimmed = shop.City?.trim();
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        if (!cityMap.has(lower)) {
          cityMap.set(lower, trimmed);
        }
      }
    });
    return Array.from(cityMap.values()).sort();
  }, [shops]);
  
  const cities = useMemo(() => ['All', ...getUniqueCities], [getUniqueCities]);

  const shopsWithDistance = useMemo(() => {
    if (!userLocation || !shops.length) {
      return shops.map(shop => ({
        ...shop,
        distance: 'N/A',
        distanceKm: Infinity
      }));
    }

    const userLat = userLocation.coords.latitude;
    const userLon = userLocation.coords.longitude;

    return shops.map(shop => {
      const coordinates = shop.ExactLocationCoord?.coordinates;
      if (!coordinates || coordinates.length < 2) {
        return {
          ...shop,
          distance: 'N/A',
          distanceKm: Infinity
        };
      }

      const shopLat = coordinates[1];
      const shopLon = coordinates[0];
      const distanceKm = calculateDistance(userLat, userLon, shopLat, shopLon);

      return {
        ...shop,
        distance: `${distanceKm.toFixed(1)} km`,
        distanceKm
      };
    });
  }, [userLocation, shops]);

  const sortOptions = [
    { key: 'name', label: 'Name A-Z', icon: 'text-outline' },
    { key: 'distance', label: 'Nearest First', icon: 'location-outline' },
  ];

  // Filter and sort shops
  const filteredAndSortedShops = useMemo(() => {
    let filtered = shopsWithDistance.filter(shop => {
      const cityMatch = selectedCity === 'All' || shop.City === selectedCity;
      const searchMatch = !searchQuery || 
        shop.ShopName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        shop.City?.toLowerCase().includes(searchQuery.toLowerCase());
      return cityMatch && searchMatch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.ShopName.localeCompare(b.ShopName);
        case 'distance':
          return a.distanceKm - b.distanceKm;
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCity, sortBy, shopsWithDistance, searchQuery]);

  const handleShopPress = (shop) => {
    console.log('Shop pressed:', shop);
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop._id }
    });
  };

  const renderShopCard = ({ item, index }) => {
    const profileImageUrl = item.ProfileImage || 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleShopPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: profileImageUrl }} 
              style={styles.shopImage}
              resizeMode="cover"
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={colors.accent} />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>

          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>
              {item.ShopName || 'Unknown Shop'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={colors.text.secondary} />
              <Text style={styles.cityText} numberOfLines={1}>
                {item.City || 'Unknown City'}
              </Text>
            </View>
            <View style={styles.servicesBadge}>
              <Ionicons name="cut-outline" size={11} color={colors.primary} />
              <Text style={styles.servicesText}>
                Services Available
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilters(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilters(false)}
      >
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select City</Text>
            <TouchableOpacity 
              onPress={() => setShowFilters(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.cityList} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterOptionsContainer}
          >
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
                <Ionicons 
                  name="location-outline" 
                  size={20} 
                  color={selectedCity === city ? colors.primary : colors.text.secondary} 
                />
                <Text style={[
                  styles.filterOptionText,
                  selectedCity === city && styles.filterOptionTextActive
                ]}>
                  {city}
                </Text>
                {selectedCity === city && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.sortModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity 
              onPress={() => setShowSortModal(false)}
              style={styles.closeButton}
            >
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
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading shops...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.secondary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllShops}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Discover Shops</Text>
      </View>

      {/* Header with Search Bar and Filter/Sort Buttons */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.light}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
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
          {filteredAndSortedShops.length} shop{filteredAndSortedShops.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Shop Grid */}
      {filteredAndSortedShops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color={colors.text.light} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No shops found' : 'No shops available'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>
              Try searching with different keywords
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedShops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}

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
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  gridContent: {
    padding: 20,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  shopImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 3,
  },
  shopInfo: {
    gap: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '400',
    marginLeft: 4,
    flex: 1,
  },
  servicesBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicesText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sortModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  cityList: {
    maxHeight: 400,
  },
  filterOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  sortOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default SeeAllShops;