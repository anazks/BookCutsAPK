import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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

const BookNow = ({ navigation }) => {
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedService, setSelectedService] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [allShops, setAllShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



   const handleBooking = (shop) => {
      console.log('Shop pressed:', shop);
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
        services: ['Haircut', 'Face wash'],
        price: '₹500-1500',
        distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
        image: `https://images.unsplash.com/photo-${1580618672591 + index}-eb180b1a973f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60`,
        isOpen: Math.random() > 0.3,
        discount: Math.random() > 0.6 ? `${Math.floor(Math.random() * 20) + 10}% OFF` : null,
        serviceType: 'Vehicle Service',
      };
    });
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllShops();
      
      if (result && result.success && result.data) {
        const transformedData = transformShopData(result.data);
        setAllShops(transformedData);
      } else {
        setError('Failed to fetch shops');
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

  // Get unique cities from the data
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(allShops.map(shop => shop.city))];
    return ['All', ...uniqueCities.sort()];
  }, [allShops]);

  const serviceTypes = ['All', 'Wheel Alignment', 'Tire Service', 'Full Service', 'Quick Check'];
  
  const sortOptions = [
    { key: 'name', label: 'Name A-Z', icon: 'text' },
    { key: 'rating', label: 'Highest Rated', icon: 'star' },
    { key: 'distance', label: 'Nearest First', icon: 'location' },
    { key: 'reviews', label: 'Most Reviewed', icon: 'chatbubbles' },
  ];

  // Filter and sort shops
  const filteredAndSortedShops = useMemo(() => {
    let filtered = allShops.filter(shop => {
      const cityMatch = selectedCity === 'All' || shop.city === selectedCity;
      const serviceMatch = selectedService === 'All' || shop.services.some(service => 
        service.toLowerCase().includes(selectedService.toLowerCase())
      );
      return cityMatch && serviceMatch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        case 'reviews':
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCity, selectedService, sortBy, allShops]);

  const renderShopCard = ({ item }) => (
    <TouchableOpacity style={styles.shopCard} activeOpacity={0.8}>
      <View style={styles.shopImageContainer}>
        <Image source={{ uri: item.image }} style={styles.shopImage} />
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? colors.secondary : colors.danger }]}>
          <Text style={styles.statusText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>

      <View style={styles.shopInfo}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceText}>Auto Service</Text>
          </View>
        </View>

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

        <View style={styles.cityTimeRow}>
          <View style={styles.cityContainer}>
            <Ionicons name="business-outline" size={14} color={colors.primary} />
            <Text style={styles.cityText}>{item.city}</Text>
          </View>
          <Text style={styles.timeText}>{item.timing}</Text>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.phoneContainer}>
            <Ionicons name="call-outline" size={14} color={colors.secondary} />
            <Text style={styles.phoneText}>{item.mobile}</Text>
          </View>
        </View>

        <View style={styles.servicesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.services.slice(0, 3).map((service, index) => (
              <View key={index} style={[styles.serviceTag, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.serviceTagText, { color: colors.primary }]}>{service}</Text>
              </View>
            ))}
            {item.services.length > 3 && (
              <View style={[styles.serviceTag, { backgroundColor: colors.text.light + '20' }]}>
                <Text style={[styles.serviceTagText, { color: colors.text.secondary }]}>
                  +{item.services.length - 3} more
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.priceText}>{item.price}</Text>
          <TouchableOpacity style={styles.bookButton} 
            onPress={()=>handleBooking(item)}
          >
            <Text style={styles.bookButtonText}>Book Service</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.filterOption,
                      selectedCity === city && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedCity(city)}
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

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Service Type</Text>
            <View style={styles.filterOptionsRow}>
              {serviceTypes.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.filterOption,
                    selectedService === service && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedService(service)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedService === service && styles.filterOptionTextActive
                  ]}>
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSelectedCity('All');
                setSelectedService('All');
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
          <Text style={styles.sortModalTitle}>Sort By</Text>
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
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Shops ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchShops}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Wheel Alignment Services</Text> */}
        {/* <TouchableOpacity>
          <Ionicons name="search" size={24} color={colors.text.primary} />
        </TouchableOpacity> */}
      </View>

      {/* Filter and Sort Bar */}
      <View style={styles.filterSortBar}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={18} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filters</Text>
          {(selectedCity !== 'All' || selectedService !== 'All') && (
            <View style={styles.activeFilterDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.primary} />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsText}>
          {filteredAndSortedShops.length} service centers found
        </Text>
      </View>

      {/* Shop List */}
      <FlatList
        data={filteredAndSortedShops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shopList}
        refreshing={loading}
        onRefresh={fetchShops}
      />

      <FilterModal />
      <SortModal />
    </SafeAreaView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterSortBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    position: 'relative',
  },
  filterButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  activeFilterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: colors.danger,
    borderRadius: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
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
    paddingBottom: 20,
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
    height: 180,
    backgroundColor: colors.border,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  shopInfo: {
    padding: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 8,
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
    marginBottom: 8,
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
    marginBottom: 12,
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
  servicesContainer: {
    marginBottom: 16,
  },
  serviceTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
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
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sortModal: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    minWidth: 250,
    marginTop: '50%',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: colors.primary + '15',
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default BookNow;