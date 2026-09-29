import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
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
  View,
} from 'react-native';
import Reanimated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllShops } from '../api/Service/Shop';
import { getCustomization } from '../api/Service/User';
import { useTabBar } from '../context/TabBarContext';
import { useAppTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_SPACING = 12;
const CARD_WIDTH = (screenWidth - (CARD_MARGIN * 2) - CARD_SPACING) / 2;

// Categories with icons
const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: '1', name: 'Haircut', icon: 'cut-outline' },
  { id: '2', name: 'Beard Trim', icon: 'man-outline' },
  { id: '3', name: 'Hair Wash', icon: 'water-outline' },
  { id: '4', name: 'Hair Color', icon: 'color-palette-outline' },
  { id: '5', name: 'Hair Spa', icon: 'sparkles-outline' },
  { id: '6', name: 'Facial', icon: 'happy-outline' },
  { id: '7', name: 'Shaving', icon: 'shield-checkmark-outline' },
  { id: '8', name: 'Massage', icon: 'fitness-outline' },
];

const KM_RANGES = ['All', '<5 km', '5-10 km', '10-20 km', '20+ km'];

// ─── Sleek Animated 2-Column Shop Card ───
const AnimatedShopCard = ({
  item,
  index = 0,
  onPress,
  onBook,
  colors,
}: {
  item: any;
  index?: number;
  onPress: () => void;
  onBook: (item: any) => void;
  colors: any;
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const cleanImage =
    item.image ||
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
  const rating = item.rating || (4.6 + ((index % 4) * 0.1)).toFixed(1);

  return (
    <Reanimated.View
      entering={FadeInDown.delay(Math.min(index * 60, 360)).springify().damping(14)}
      style={cardStyles.cardWrapper}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={cardStyles.card}
          activeOpacity={0.94}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Card Thumbnail */}
          <View style={cardStyles.imageContainer}>
            <Image
              source={{ uri: cleanImage }}
              style={cardStyles.image}
              resizeMode="cover"
            />

            {/* Top-Right: Rating Pill */}
            <View style={cardStyles.ratingPill}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={cardStyles.ratingText}>{rating}</Text>
            </View>

            {/* Top-Left: PRO / Discount Pill */}
            {item.discount ? (
              <View style={cardStyles.discountPill}>
                <Ionicons name="pricetag" size={9} color="#FFFFFF" />
                <Text style={cardStyles.discountText}>{item.discount}</Text>
              </View>
            ) : (
              <View style={cardStyles.proPill}>
                <Ionicons name="sparkles" size={9} color="#FFFFFF" />
                <Text style={cardStyles.proText}>PRO</Text>
              </View>
            )}

            {/* Bottom-Left: Distance Pill */}
            {item.distanceText ? (
              <View style={cardStyles.distancePill}>
                <Ionicons name="navigate" size={9} color="#FFFFFF" />
                <Text style={cardStyles.distanceText} numberOfLines={1}>
                  {item.distanceText}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Card Body */}
          <View style={cardStyles.content}>
            <Text style={cardStyles.shopName} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Location row */}
            <View style={cardStyles.infoRow}>
              <Ionicons name="location-sharp" size={11} color="#94A3B8" />
              <Text style={cardStyles.locationText} numberOfLines={1}>
                {item.city || 'Nearby'}
              </Text>
            </View>

            {/* Status & Timing row */}
            <View style={cardStyles.statusRow}>
              <View style={cardStyles.statusDot} />
              <Text style={cardStyles.statusText}>Open</Text>
              <Text style={cardStyles.timingText} numberOfLines={1}>
                • {item.timing || '9 AM - 8 PM'}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={cardStyles.bookButton}
              activeOpacity={0.85}
              onPress={(e) => {
                e.stopPropagation();
                onBook(item);
              }}
            >
              <Text style={cardStyles.bookButtonText}>Book Slot</Text>
              <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Reanimated.View>
  );
};

// ─── Main Book Tab Component ───
const BookNow = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const colors = useMemo(
    () => ({
      primary: '#2563EB',
      primaryLight: '#EFF6FF',
      primaryDark: '#1D4ED8',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: {
        primary: '#0F172A',
        secondary: '#64748B',
        light: '#94A3B8',
      },
      border: '#E2E8F0',
      overlay: 'rgba(15, 23, 42, 0.5)',
    }),
    [theme]
  );

  const { tabBarOffset } = useTabBar();
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;
      if (currentScrollY <= 0) {
        tabBarOffset.value = withTiming(0, { duration: 200 });
      } else if (currentScrollY > lastScrollY.value + 8) {
        tabBarOffset.value = withTiming(100, { duration: 200 });
      } else if (currentScrollY < lastScrollY.value - 8) {
        tabBarOffset.value = withTiming(0, { duration: 200 });
      }
      lastScrollY.value = currentScrollY;
    },
  });

  const [selectedCity, setSelectedCity] = useState('All');
  const [citiesList, setCitiesList] = useState<string[]>(['All']);
  const [selectedKmRange, setSelectedKmRange] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('distance');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [allShops, setAllShops] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [backgroundCustomization, setBackgroundCustomization] = useState<any>(null);

  const fetchCustomization = async () => {
    try {
      const response = await getCustomization('booking');
      if (response && response.success) {
        setBackgroundCustomization(response.customization);
      }
    } catch (err) {
      console.error('Error fetching booking customization:', err);
    }
  };

  useEffect(() => {
    fetchCustomization();
  }, []);

  // Randomized Filter Logic for diverse service categories
  const [randomizedShops, setRandomizedShops] = useState<any[] | null>(null);

  useEffect(() => {
    if (selectedCategory === 'All' || selectedCategory === 'Haircut') {
      setRandomizedShops(null);
    } else {
      const currentFiltered = allShops.filter(
        (s) => s.city === selectedCity || selectedCity === 'All'
      );
      const shuffled = [...currentFiltered].sort(() => Math.random() - 0.5);
      setRandomizedShops(shuffled.slice(0, Math.floor(Math.random() * 4) + 5));
    }
  }, [selectedCategory, selectedCity, allShops]);

  const handleCardPress = (shop: any) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id },
    });
  };

  const handleBooking = (shop: any) => {
    router.push({
      pathname: '/Screens/User/BookNow',
      params: { shop_id: shop.id },
    });
  };

  const transformShopData = (apiData: any[]) => {
    return apiData.map((shop: any, index: number) => {
      const shopName =
        shop.ShopName || `${shop.firstName || ''} ${shop.lastName || ''}`.trim() || 'Salon';
      const city = shop.City || shop.city || 'Nearby';
      const mobile = shop.Mobile || shop.mobileNo || '';
      const timing = shop.Timing || '9:00 AM - 8:00 PM';
      const website = shop.website || '';

      return {
        id: shop._id,
        name: shopName,
        city: city,
        mobile: mobile,
        timing: timing,
        website: website,
        price: '₹200-800',
        coordinates: shop.ExactLocationCoord ? shop.ExactLocationCoord.coordinates : null,
        image:
          shop.ProfileImage ||
          `https://images.unsplash.com/photo-${1580618672591 + index}-eb180b1a973f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60`,
        isOpen: true,
        serviceType: ['Haircut', 'Beard Trim', 'Facial', 'Massage', 'Hair Color'][
          index % 5
        ],
        distanceText: shop.distanceText,
        distanceKm: shop.distance,
      };
    });
  };

  const fetchShops = async (pageNum = 1, isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params: any = {
        page: pageNum,
        limit: 10,
        sort: sortBy === 'name' ? 'name' : undefined,
        order: 'asc',
      };
      if (selectedCity !== 'All') {
        params.city = selectedCity;
      }
      if (userLocation) {
        params.lat = userLocation.coords.latitude;
        params.lng = userLocation.coords.longitude;
      }

      const result = await getAllShops(params);

      if (result && result.success) {
        const transformedData = result.data ? transformShopData(result.data) : [];
        if (pageNum === 1) {
          setAllShops(transformedData);
        } else {
          setAllShops((prev) => [...prev, ...transformedData]);
        }

        if (result.cities) {
          setCitiesList(['All', ...result.cities]);
        }

        if (result.pagination) {
          setHasMore(result.pagination.hasNextPage);
        } else {
          setHasMore(transformedData.length === 10);
        }
        setPage(pageNum);
      } else {
        if (pageNum === 1) setError(result?.message || 'Failed to fetch shops');
      }
    } catch (err: any) {
      if (err?.message === 'No shops found') {
        if (pageNum === 1) setAllShops([]);
        setHasMore(false);
        setError(null);
      } else {
        if (pageNum === 1) setError(err?.message || 'Network error occurred');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        }
      } catch (e) {
        console.log('Location error:', e);
      } finally {
        setLocationLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (locationLoaded) {
      fetchShops(1);
    }
  }, [locationLoaded, selectedCity, sortBy]);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchShops(page + 1);
    }
  };

  const sortOptions = [
    { key: 'distance', label: 'Nearest First', icon: 'location-outline' },
    { key: 'name', label: 'Name (A to Z)', icon: 'text-outline' },
  ];

  const filteredAndSortedShops = useMemo(() => {
    if (randomizedShops) {
      return randomizedShops;
    }

    return allShops.filter((shop: any) => {
      const cityMatch = selectedCity === 'All' || shop.city === selectedCity;
      const searchMatch =
        !searchQuery ||
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchQuery.toLowerCase());

      let kmMatch = true;
      if (selectedKmRange !== 'All' && shop.distanceKm !== undefined) {
        const dist = shop.distanceKm as number;
        if (selectedKmRange === '<5 km') kmMatch = dist <= 5;
        else if (selectedKmRange === '5-10 km') kmMatch = dist > 5 && dist <= 10;
        else if (selectedKmRange === '10-20 km') kmMatch = dist > 10 && dist <= 20;
        else if (selectedKmRange === '20+ km') kmMatch = dist > 20;
      }

      let categoryMatch = true;
      if (selectedCategory !== 'All' && selectedCategory !== 'Haircut') {
        categoryMatch = shop.serviceType === selectedCategory;
      }

      return cityMatch && searchMatch && kmMatch && categoryMatch;
    });
  }, [selectedCity, sortBy, allShops, searchQuery, selectedKmRange, selectedCategory, randomizedShops]);

  const hasActiveFilters =
    selectedCity !== 'All' ||
    selectedCategory !== 'All' ||
    selectedKmRange !== 'All' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedCity('All');
    setSearchQuery('');
    setSelectedKmRange('All');
    setSelectedCategory('All');
  };

  // ── Empty State ──
  const renderEmptyComponent = () => (
    <View style={screenStyles.emptyContainer}>
      <View style={screenStyles.emptyIconCircle}>
        <Ionicons name="search-outline" size={40} color="#94A3B8" />
      </View>
      <Text style={screenStyles.emptyTitle}>No Salons Found</Text>
      <Text style={screenStyles.emptyText}>
        We couldn't find any salons matching your current filters. Try changing your search query or location.
      </Text>
      <TouchableOpacity style={screenStyles.emptyButton} onPress={handleResetFilters}>
        <Ionicons name="refresh-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={screenStyles.emptyButtonText}>Reset All Filters</Text>
      </TouchableOpacity>
    </View>
  );

  // ── City Filter Modal ──
  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <TouchableOpacity
        style={screenStyles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilters(false)}
      >
        <View style={screenStyles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={screenStyles.modalHandle} />

          <View style={screenStyles.modalHeader}>
            <View>
              <Text style={screenStyles.modalTitle}>Select Location</Text>
              <Text style={screenStyles.modalSubtitle}>Filter salons by city</Text>
            </View>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={screenStyles.closeButton}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={screenStyles.modalScroll} showsVerticalScrollIndicator={false}>
            {citiesList.map((city, idx) => {
              const isSelected = selectedCity === city;
              return (
                <TouchableOpacity
                  key={`${city}-${idx}`}
                  style={[screenStyles.filterOption, isSelected && screenStyles.filterOptionActive]}
                  onPress={() => {
                    setSelectedCity(city);
                    setShowFilters(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      screenStyles.filterOptionIcon,
                      isSelected && { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Ionicons
                      name={city === 'All' ? 'globe-outline' : 'location-sharp'}
                      size={18}
                      color={isSelected ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={[
                      screenStyles.filterOptionText,
                      isSelected && screenStyles.filterOptionTextActive,
                    ]}
                  >
                    {city === 'All' ? 'All Cities' : city}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── Sort Modal ──
  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={screenStyles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={screenStyles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={screenStyles.modalHandle} />

          <View style={screenStyles.modalHeader}>
            <View>
              <Text style={screenStyles.modalTitle}>Sort Salons</Text>
              <Text style={screenStyles.modalSubtitle}>Choose display order</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSortModal(false)} style={screenStyles.closeButton}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={screenStyles.modalScroll}>
            {sortOptions.map((option) => {
              const isSelected = sortBy === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[screenStyles.filterOption, isSelected && screenStyles.filterOptionActive]}
                  onPress={() => {
                    setSortBy(option.key);
                    setShowSortModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      screenStyles.filterOptionIcon,
                      isSelected && { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={isSelected ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={[
                      screenStyles.filterOptionText,
                      isSelected && screenStyles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── Loading Screen ──
  if (loading) {
    return (
      <View style={[screenStyles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={screenStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={screenStyles.loadingText}>Finding best salons near you...</Text>
        </View>
      </View>
    );
  }

  // ── Error Screen ──
  if (error) {
    return (
      <View style={[screenStyles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={screenStyles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={54} color="#94A3B8" />
          <Text style={screenStyles.errorTitle}>Unable to Load Salons</Text>
          <Text style={screenStyles.errorText}>{error}</Text>
          <TouchableOpacity style={screenStyles.retryButton} onPress={() => fetchShops()}>
            <Text style={screenStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={screenStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Fixed Clean Header ── */}
      <View style={[screenStyles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={screenStyles.titleRow}>
          <View>
            <Text style={screenStyles.titleText}>Explore Salons</Text>
            <Text style={screenStyles.subtitleText}>Book appointments in seconds</Text>
          </View>

          {/* City Selector Pill */}
          <TouchableOpacity
            style={screenStyles.cityPickerButton}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-sharp" size={13} color="#2563EB" />
            <Text style={screenStyles.cityPickerText} numberOfLines={1}>
              {selectedCity === 'All' ? 'All Cities' : selectedCity}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Salon Feed ── */}
      <Reanimated.FlatList
        ListHeaderComponent={
          <View style={screenStyles.listHeader}>
            {/* Search and Action Bar */}
            <View style={screenStyles.searchRow}>
              <View style={screenStyles.searchContainer}>
                <Ionicons
                  name="search"
                  size={17}
                  color="#94A3B8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={screenStyles.searchInput}
                  placeholder="Search salons, locations, services..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#94A3B8"
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={screenStyles.clearSearch}
                  >
                    <Ionicons name="close-circle" size={17} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Sort Action Button */}
              <TouchableOpacity
                style={[
                  screenStyles.iconActionButton,
                  sortBy !== 'distance' && screenStyles.iconActionButtonActive,
                ]}
                onPress={() => setShowSortModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="swap-vertical"
                  size={17}
                  color={sortBy !== 'distance' ? '#2563EB' : '#475569'}
                />
              </TouchableOpacity>
            </View>

            {/* Custom Promo Banner (if present from admin) */}
            {backgroundCustomization?.backgroundImage && (
              <View style={screenStyles.promoCard}>
                <Image
                  source={{ uri: backgroundCustomization.backgroundImage }}
                  style={screenStyles.promoImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Categories Horizontal Scroll */}
            <View style={screenStyles.categoriesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={screenStyles.categoriesScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        screenStyles.categoryChip,
                        isSelected && screenStyles.categoryChipActive,
                      ]}
                      onPress={() =>
                        setSelectedCategory(isSelected ? 'All' : cat.name)
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? '#FFFFFF' : '#64748B'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          screenStyles.categoryChipText,
                          isSelected && screenStyles.categoryChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Distance Radius Filter Chips */}
            <View style={screenStyles.kmSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={screenStyles.kmScroll}
              >
                <Text style={screenStyles.kmLabel}>Distance:</Text>
                {KM_RANGES.map((range) => {
                  const isSelected = selectedKmRange === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        screenStyles.kmPill,
                        isSelected && screenStyles.kmPillActive,
                      ]}
                      onPress={() => setSelectedKmRange(range)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          screenStyles.kmPillText,
                          isSelected && screenStyles.kmPillTextActive,
                        ]}
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active Filters Bar / Summary */}
            <View style={screenStyles.summaryBar}>
              <Text style={screenStyles.resultsCount}>
                {filteredAndSortedShops.length}{' '}
                {filteredAndSortedShops.length === 1 ? 'Salon' : 'Salons'} Available
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={handleResetFilters}
                  style={screenStyles.clearAllFilters}
                >
                  <Ionicons name="refresh" size={11} color="#2563EB" />
                  <Text style={screenStyles.clearAllFiltersText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={filteredAndSortedShops}
        renderItem={({ item, index }) => (
          <AnimatedShopCard
            item={item}
            index={index}
            onPress={() => handleCardPress(item)}
            onBook={handleBooking}
            colors={colors}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          screenStyles.shopList,
          filteredAndSortedShops.length === 0 && screenStyles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={() => fetchShops(1, true)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#2563EB"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
        columnWrapperStyle={screenStyles.columnWrapper}
      />

      <FilterModal />
      <SortModal />
    </View>
  );
};

// ─── 2-Column Card Styles ───
const cardStyles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: CARD_SPACING,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 124,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  discountPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  proPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 3,
  },
  proText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  distancePill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    padding: 10,
  },
  shopName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 3,
  },
  locationText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '700',
  },
  timingText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  bookButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

// ─── Screen Layout Styles ───
const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  cityPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    maxWidth: 130,
  },
  cityPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  listHeader: {
    paddingTop: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  clearSearch: {
    padding: 4,
  },
  iconActionButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconActionButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  promoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  categoriesSection: {
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kmSection: {
    marginBottom: 12,
  },
  kmScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  kmLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kmPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  kmPillActive: {
    backgroundColor: '#0F172A',
  },
  kmPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  kmPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  resultsCount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  clearAllFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  clearAllFiltersText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  shopList: {
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: CARD_MARGIN,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  filterOptionActive: {
    backgroundColor: '#F8FAFC',
  },
  filterOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
  },
  filterOptionTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});

export default BookNow;