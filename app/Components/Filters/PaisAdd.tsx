import { fetchPremiumShops } from '@/app/api/Service/User';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

  useEffect(() => {
    if (shops.length === 0 || loading) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const newIndex = (prev + 1) % shops.length;
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        return newIndex;
      });
    }, 4500); // Slightly slower transition for luxury feel
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
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleShopPress(item._id)}
          style={styles.cardTouchable}
        >
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              {firstImage ? (
                <Image source={{ uri: firstImage }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={50} color="#333" />
                </View>
              )}

              {/* Minimalist Top Gradient for Badge visibility */}
              <View style={styles.topGradient} />

              {/* Elite Badge - Square & Gold */}
              <View style={styles.premiumBadge}>
                <FontAwesome5 name="crown" size={10} color="#000" />
                <Text style={styles.premiumText}>ELITE SELECTION</Text>
              </View>

              {/* Info Overlay - Bottom Aligned */}
              <View style={styles.infoContainer}>
                <View style={styles.textWrapper}>
                  <Text style={styles.shopName}>{item.ShopName.toUpperCase()}</Text>
                  <View style={styles.taglineRow}>
                    <View style={styles.goldLine} />
                    <Text style={styles.tagline}>PREMIUM GROOMING</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bookButton}
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShopPress(item._id);
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#000" />
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
        <ActivityIndicator size="small" color="#D4AF37" />
      </View>
    );
  }

  if (shops.length === 0) return null;

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
        snapToInterval={SCREEN_WIDTH - 32}
        decelerationRate="fast"
      />
      {renderPagination()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginBottom: 10,
    marginTop: 10,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 16,
    height: 260,
  },
  cardTouchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    // Square edges
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.85, // Darkens image slightly to make text pop
  },
  placeholderImage: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  premiumText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  textWrapper: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goldLine: {
    width: 20,
    height: 1,
    backgroundColor: '#D4AF37',
  },
  tagline: {
    fontSize: 11,
    color: '#D4AF37',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  bookButton: {
    width: 45,
    height: 45,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paginationDot: {
    width: 4,
    height: 4,
    backgroundColor: '#333',
  },
  activePaginationDot: {
    width: 20,
    height: 4,
    backgroundColor: '#D4AF37',
  },
});