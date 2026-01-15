import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router'; // Make sure you're using expo-router
import { fetchPremiumShops } from '@/app/api/Service/User';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumShop {
  _id: string;
  ShopName: string;
  media: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  ProfileImage?: string;
}

export default function ShopCarousel() {
  const [shops, setShops] = useState<PremiumShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Navigate to shop detail page
  const handleShopPress = (shopId: string) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shopId },
    });
  };

  useEffect(() => {
    const loadPremiumShops = async () => {
      try {
        const response = await fetchPremiumShops();
        if (response.success && response.premiumShops) {
          const validShops = response.premiumShops.filter(
            (shop: PremiumShop) => shop.media && shop.media.length > 0
          );
          setShops(validShops);
        }
      } catch (error) {
        console.error('Error fetching premium shops:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPremiumShops();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (shops.length === 0 || loading) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const newIndex = (prev + 1) % shops.length;
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        return newIndex;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [shops.length, loading]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (SCREEN_WIDTH - 32));
    setActiveIndex(index);
  };

  const renderShopCard = ({ item }: { item: PremiumShop }) => {
    const firstImage = item.media[0]?.url || item.ProfileImage;

    return (
      <View style={styles.cardContainer}>
        {/* Full Card Touchable - Navigate on press */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleShopPress(item._id)}
          style={styles.cardTouchable}
        >
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              {firstImage ? (
                <Image source={{ uri: firstImage }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={50} color="#9CA3AF" />
                </View>
              )}

              {/* Premium Badge */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>PREMIUM</Text>
              </View>

              {/* Overlay Info */}
              <View style={styles.infoContainer}>
                <View style={styles.nameContainer}>
                  <Text style={styles.shopName}>{item.ShopName}</Text>
                  <Text style={styles.tagline}>Premium Grooming Experience</Text>
                </View>

                {/* Book Button - Also navigates (optional: you can keep or remove onPress here) */}
                <TouchableOpacity
                  style={styles.bookButton}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent double navigation if parent is also pressed
                    handleShopPress(item._id);
                  }}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                  <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {shops.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            activeIndex === index && styles.activePaginationDot,
          ]}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#EF4444" />
      </View>
    );
  }

  if (shops.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={shops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
        snapToInterval={SCREEN_WIDTH - 32}
        decelerationRate="fast"
        onScrollToIndexFailed={() => {}}
      />
      {renderPagination()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    marginBottom: 24,
    marginTop: 8,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    flexGrow: 0,
  },
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: 8,
    height: 240,
  },
  cardTouchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  nameContainer: {
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '400',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
    backgroundColor: '#EF4444',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  activePaginationDot: {
    width: 24,
    backgroundColor: '#EF4444',
  },
});