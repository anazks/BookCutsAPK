import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import Reanimated, { FadeInDown, FadeInRight, useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getAllShops } from '../api/Service/Shop';
import { useTabBar } from '../context/TabBarContext';

// Updated color palette - flat, clean design
const colors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#F0F0F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  rating: {
    excellent: '#2563EB',
    good: '#10B981',
    average: '#F59E0B',
    poor: '#EF4444',
  }
};

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_SPACING = 12;
const CARD_WIDTH = (screenWidth - (CARD_MARGIN * 2) - CARD_SPACING) / 2;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return colors.rating.excellent;
  if (rating >= 4.0) return colors.rating.good;
  if (rating >= 3.5) return colors.rating.average;
  return colors.rating.poor;
};

// Animated Card Component
const AnimatedShopCard = ({ item, index = 0, onPress, onBook }) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const ratingColor = getRatingColor(item.rating);

  return (
    <Reanimated.View
      entering={FadeInDown.delay(index * 100).springify().damping(12)}
      style={styles.cardWrapper}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.shopCard}
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.shopImageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.shopImage}
              resizeMode="cover"
            />

            {/* Rating Badge - Always show */}
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
            </View>

            {/* Discount Badge - Optional */}
            {item.discount && (
              <View style={styles.discountBadge}>
                <Ionicons name="pricetag-outline" size={10} color="#FFFFFF" />
                <Text style={styles.discountText}>{item.discount}</Text>
              </View>
            )}
          </View>

          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>

            {/* Location with icon */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={12} color={colors.text.light} />
              <Text style={styles.infoText} numberOfLines={1}>{item.city}</Text>
              {item.distance !== 'N/A' && (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.distanceText}>{item.distance}</Text>
                </>
              )}
            </View>

            {/* Timing with icon */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={12} color={colors.text.light} />
              <Text style={styles.infoText} numberOfLines={1}>{item.timing}</Text>
            </View>

            {/* Price and Book Button */}
            <View style={styles.priceBookRow}>
              <Text style={styles.priceText}>{item.price}</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onBook(item);
                }}
              >
                <Text style={styles.bookButtonText}>Book</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Reanimated.View>
  );
};

const MOCK_CATEGORIES = [
  { id: '1', name: 'Haircut', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=150&q=80' },
  { id: '2', name: 'Beard Trim', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=150&q=80' },
  { id: '3', name: 'Facial', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=150&q=80' },
  { id: '4', name: 'Massage', image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=150&q=80' },
  { id: '5', name: 'Hair Color', image: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=150&q=80' },
];

const KM_RANGES = ['All', '<5 km', '5-10 km', '10-20 km', '20+ km'];

const PROMO_BANNERS = [
  { id: 'b1', type: 'mp4', url: 'https://cdn.pixabay.com/video/2019/04/16/22753-330656094_medium.mp4' },
  { id: 'b2', type: 'image', url: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&w=600&q=80' },
  { id: 'b3', type: 'image', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
];

const BookNow = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { tabBarOffset } = useTabBar();
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;

      if (currentScrollY <= 0) {
        tabBarOffset.value = withTiming(0, { duration: 200 });
      } else if (currentScrollY > lastScrollY.value + 5) {
        tabBarOffset.value = withTiming(100, { duration: 200 }); // hide
      } else if (currentScrollY < lastScrollY.value - 5) {
        tabBarOffset.value = withTiming(0, { duration: 200 }); // show
      }

      lastScrollY.value = currentScrollY;
    },
  });

  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedKmRange, setSelectedKmRange] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [allShops, setAllShops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const transformShopData = (apiData) => {
    return apiData.map((shop, index) => {
      const shopName = shop.ShopName || `${shop.firstName} ${shop.lastName}` || 'Unknown Shop';
      const city = shop.City || shop.city || 'Unknown City';
      const mobile = shop.Mobile || shop.mobileNo || 'N/A';
      const timing = shop.Timing || '9:00 AM - 8:00 PM';
      const website = shop.website || '';

      return {
        id: shop._id,
        name: shopName,
        rating: 4.0 + (Math.random() * 1),
        reviews: Math.floor(Math.random() * 200) + 50,
        city: city,
        mobile: mobile,
        timing: timing,
        website: website,
        price: '₹500-1500',
        coordinates: shop.ExactLocationCoord ? shop.ExactLocationCoord.coordinates : null,
        image: shop.ProfileImage || `https://images.unsplash.com/photo-${1580618672591 + index}-eb180b1a973f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60`,
        isOpen: Math.random() > 0.3,
        serviceType: ['Haircut', 'Beard Trim', 'Facial', 'Massage', 'Hair Color'][Math.floor(Math.random() * 5)],
      };
    });
  };

  const fetchShops = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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
      setRefreshing(false);
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
    { key: 'rating', label: 'Highest Rated', icon: 'star-outline' },
  ];

  const filteredAndSortedShops = useMemo(() => {
    let filtered = shopsWithDistance.filter(shop => {
      const cityMatch = selectedCity === 'All' || shop.city === selectedCity;
      const searchMatch = !searchQuery ||
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchQuery.toLowerCase());

      let kmMatch = true;
      if (selectedKmRange !== 'All' && shop.distanceKm !== Infinity) {
        if (selectedKmRange === '<5 km') kmMatch = shop.distanceKm <= 5;
        else if (selectedKmRange === '5-10 km') kmMatch = shop.distanceKm > 5 && shop.distanceKm <= 10;
        else if (selectedKmRange === '10-20 km') kmMatch = shop.distanceKm > 10 && shop.distanceKm <= 20;
        else if (selectedKmRange === '20+ km') kmMatch = shop.distanceKm > 20;
      }

      let categoryMatch = true;
      if (selectedCategory !== 'All') {
        categoryMatch = shop.serviceType === selectedCategory;
      }

      return cityMatch && searchMatch && kmMatch && categoryMatch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'distance':
          return a.distanceKm - b.distanceKm;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCity, sortBy, shopsWithDistance, searchQuery]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="search-outline" size={48} color={colors.text.light} />
      </View>
      <Text style={styles.emptyTitle}>No shops found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your filters or search criteria
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          setSelectedCity('All');
          setSearchQuery('');
        }}
      >
        <Text style={styles.emptyButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilters(false)}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by City</Text>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
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
                activeOpacity={0.7}
              >
                <Ionicons
                  name={city === 'All' ? 'apps-outline' : 'location-outline'}
                  size={18}
                  color={selectedCity === city ? colors.primary : colors.text.secondary}
                />
                <Text style={[
                  styles.filterOptionText,
                  selectedCity === city && styles.filterOptionTextActive
                ]}>
                  {city}
                </Text>
                {selectedCity === city && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
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
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalScroll}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  sortBy === option.key && styles.filterOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortModal(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={sortBy === option.key ? colors.primary : colors.text.secondary}
                />
                <Text style={[
                  styles.filterOptionText,
                  sortBy === option.key && styles.filterOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.text.light} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchShops()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeFiltersCount = (selectedCity !== 'All' ? 1 : 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={colors.text.light} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.light}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={16} color={colors.text.light} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter and Sort Buttons */}
        <View style={styles.filterSortRow}>
          <TouchableOpacity
            style={[
              styles.filterSortButton,
              selectedCity !== 'All' && styles.filterSortButtonActive
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={selectedCity !== 'All' ? colors.primary : colors.text.secondary}
            />
            <Text style={[
              styles.filterSortButtonText,
              selectedCity !== 'All' && styles.filterSortButtonTextActive
            ]}>
              Filter
            </Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterSortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.filterSortButtonText}>Sort</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters Section */}
      {selectedCity !== 'All' && (
        <View style={styles.activeFiltersSection}>
          <View style={styles.activeFilterChip}>
            <Ionicons name="location-outline" size={12} color={colors.primary} />
            <Text style={styles.activeFilterText}>{selectedCity}</Text>
            <TouchableOpacity
              onPress={() => setSelectedCity('All')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shop List */}
      <Reanimated.FlatList
        ListHeaderComponent={() => (
          <View style={styles.listHeaderContainer}>
            {/* Video / Marketing Banners */}
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={PROMO_BANNERS}
              keyExtractor={item => item.id}
              snapToAlignment="center"
              decelerationRate="fast"
              renderItem={({ item }) => (
                <View style={styles.bannerContainer}>
                  {item.type === 'mp4' ? (
                    <WebView
                      style={styles.bannerImage}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      scrollEnabled={false}
                      source={{
                        html: `
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                              <style>
                                body { margin: 0; padding: 0; background-color: black; overflow: hidden; }
                                video { width: 100vw; height: 100vh; object-fit: cover; }
                              </style>
                            </head>
                            <body>
                              <video autoplay loop muted playsinline>
                                <source src="${item.url}" type="video/mp4" />
                              </video>
                            </body>
                          </html>
                        `
                      }}
                      pointerEvents="none"
                    />
                  ) : (
                    <>
                      <Image source={{ uri: item.url }} style={styles.bannerImage} resizeMode="cover" />
                      {item.type === 'video' && (
                        <View style={styles.videoBadge}>
                          <Ionicons name="play-circle" size={14} color="white" />
                          <Text style={styles.videoBadgeText}>Ad</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            />

            {/* What's on your mind? */}
            <View style={styles.whatsOnMindSection}>
              <Text style={styles.sectionTitle}>What's on your mind?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {MOCK_CATEGORIES.map((cat, index) => (
                  <Reanimated.View key={cat.id} entering={FadeInRight.delay(index * 100).springify()}>
                    <TouchableOpacity
                      style={styles.categoryBadge}
                      onPress={() => setSelectedCategory(selectedCategory === cat.name ? 'All' : cat.name)}
                    >
                      <View style={[styles.categoryImageContainer, selectedCategory === cat.name && styles.categoryImageSelected]}>
                        <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                      </View>
                      <Text style={[styles.categoryName, selectedCategory === cat.name && styles.categoryNameSelected]}>{cat.name}</Text>
                    </TouchableOpacity>
                  </Reanimated.View>
                ))}
              </ScrollView>
            </View>

            {/* KM Radius Filters */}
            <View style={styles.kmFilterSection}>
              <Text style={styles.sectionTitle}>Distance Range</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kmScroll}>
                {KM_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.kmPill, selectedKmRange === range && styles.kmPillActive]}
                    onPress={() => setSelectedKmRange(range)}
                  >
                    <Text style={[styles.kmPillText, selectedKmRange === range && styles.kmPillTextActive]}>{range}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={filteredAndSortedShops}
        renderItem={({ item, index }) => (
          <AnimatedShopCard
            item={item}
            index={index}
            onPress={() => handleCardPress(item)}
            onBook={handleBooking}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.shopList,
          filteredAndSortedShops.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={() => fetchShops(true)}
        columnWrapperStyle={styles.columnWrapper}
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    height: '100%',
  },
  clearSearch: {
    padding: 4,
  },
  filterSortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  filterSortButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterSortButtonText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterSortButtonTextActive: {
    color: colors.primary,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  activeFiltersSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeFilterText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  shopList: {
    paddingHorizontal: CARD_MARGIN / 2,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: CARD_MARGIN / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: CARD_SPACING,
  },
  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopImageContainer: {
    height: 120,
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  discountText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shopInfo: {
    padding: 10,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: colors.text.secondary,
    flex: 1,
  },
  dotSeparator: {
    fontSize: 11,
    color: colors.text.light,
    marginHorizontal: 2,
  },
  distanceText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  priceBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 12,
    marginBottom: 4,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  // SWIGGY NEW STYLES
  listHeaderContainer: {
    paddingBottom: 20,
  },
  bannerContainer: {
    width: screenWidth,
    height: 200,
    marginTop: 0,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  whatsOnMindSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryBadge: {
    alignItems: 'center',
    width: 72,
  },
  categoryImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  categoryImageSelected: {
    borderColor: colors.primary,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center'
  },
  categoryNameSelected: {
    color: colors.primary,
    fontWeight: '800'
  },
  kmFilterSection: {
    marginTop: 20,
    marginBottom: 10
  },
  kmScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  kmPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kmPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kmPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  kmPillTextActive: {
    color: '#FFFFFF',
  }
});

export default BookNow;