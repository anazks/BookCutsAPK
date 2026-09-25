import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fetchPremiumShops } from '../../api/Service/User';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 28;
const CARD_HEIGHT = 176;

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  badge: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  rating?: string | number;
  location?: string;
  timing?: string;
  discount?: string;
  imageUrl: string;
  shopId?: string;
  actionType: 'shop' | 'offers' | 'book';
  tags: string[];
}

const DEFAULT_BANNER_DATA: Record<string, BannerItem[]> = {
  men: [
    {
      id: 'default-men-1',
      title: 'VIP Master Barber Club',
      subtitle: 'Premium Grooming Experience',
      tagline: 'Precision fades, beard sculpting & hot towel care',
      badge: 'FEATURED SALON',
      badgeIcon: 'diamond',
      rating: '4.9',
      location: 'City Center',
      timing: '9 AM - 9 PM',
      discount: 'FLAT 20% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      actionType: 'book',
      tags: ['Fade Masters', 'Instant Slot'],
    },
    {
      id: 'default-men-2',
      title: 'Zero-Wait Express Chair',
      subtitle: 'Skip the Line Instantly',
      tagline: 'Reserve slot online & walk straight to your stylist',
      badge: 'ZERO QUEUE',
      badgeIcon: 'flash',
      rating: '4.8',
      location: 'Near You',
      timing: 'Open Now',
      discount: 'INSTANT PASS',
      imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
      actionType: 'book',
      tags: ['No Waiting', 'AC Salon'],
    },
    {
      id: 'default-men-3',
      title: 'Royal Beard & Hair Spa',
      subtitle: 'Complete Revitalization',
      tagline: 'Organic hair wash, head massage & luxury trim',
      badge: 'TOP RATED',
      badgeIcon: 'ribbon',
      rating: '5.0',
      location: 'Top Salons',
      timing: 'Available Today',
      discount: 'COMBO PACK',
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
      actionType: 'book',
      tags: ['Luxury Spa', 'Beard Care'],
    },
  ],
  womens: [
    {
      id: 'default-women-1',
      title: 'Luxe Hair & Beauty Studio',
      subtitle: 'Elite Styling & Spa',
      tagline: 'Keratin hair therapy, balayage & bridal pampering',
      badge: 'TRENDING SALON',
      badgeIcon: 'sparkles',
      rating: '4.9',
      location: 'Prime Location',
      timing: '10 AM - 8 PM',
      discount: 'UP TO 30% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
      actionType: 'book',
      tags: ['Hair Coloring', 'Bridal Expert'],
    },
    {
      id: 'default-women-2',
      title: 'Organic Glow Facial & Spa',
      subtitle: 'Pure Skin Indulgence',
      tagline: 'Dermat-certified botanical care & deep rejuvenation',
      badge: 'WELLNESS SPOT',
      badgeIcon: 'heart',
      rating: '4.8',
      location: 'City Studio',
      timing: 'Open Now',
      discount: '25% NEW CLIENT',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      actionType: 'book',
      tags: ['Glow Facial', 'Aroma Spa'],
    },
  ],
  kids: [
    {
      id: 'default-kids-1',
      title: 'Supercuts Junior Club',
      subtitle: 'Gentle & Fun Kids Haircuts',
      tagline: 'Gaming chairs, cartoons & certified patient stylists',
      badge: 'KIDS FAVORITE',
      badgeIcon: 'happy',
      rating: '4.9',
      location: 'Family Plaza',
      timing: '10 AM - 8 PM',
      discount: 'KID COMBO OFFER',
      imageUrl: 'https://images.unsplash.com/photo-1595475207225-428b62bda831?w=800&auto=format&fit=crop&q=80',
      actionType: 'book',
      tags: ['Gaming Chairs', 'Gentle Care'],
    },
  ],
};

interface InteractiveHomeBannerProps {
  category?: 'men' | 'womens' | 'kids';
  onPressItem?: (item: BannerItem) => void;
}

export default function InteractiveHomeBanner({
  category = 'men',
  onPressItem,
}: InteractiveHomeBannerProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState<BannerItem[]>(
    DEFAULT_BANNER_DATA[category] || DEFAULT_BANNER_DATA.men
  );
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const BANNER_GRADIENTS: Record<string, [string, string, string][]> = {
    men: [
      ['#0F172A', '#1E293B', '#1E3A8A'],
      ['#1E1B4B', '#2E1065', '#3B0764'],
      ['#022C22', '#064E3B', '#0F766E'],
    ],
    womens: [
      ['#4C0519', '#881337', '#BE185D'],
      ['#3B0764', '#581C87', '#7E22CE'],
      ['#1C1917', '#292524', '#44403C'],
    ],
    kids: [
      ['#451A03', '#78350F', '#B45309'],
      ['#064E3B', '#047857', '#059669'],
      ['#1E1B4B', '#1D4ED8', '#2563EB'],
    ],
  };

  const getBannerGradient = (idx: number): [string, string, string] => {
    const list = BANNER_GRADIENTS[category] || BANNER_GRADIENTS.men;
    return list[idx % list.length];
  };

  const getBannerIcon = (item: BannerItem): keyof typeof Ionicons.glyphMap => {
    if (item.badgeIcon) return item.badgeIcon;
    const lower = (item.title + ' ' + item.badge).toLowerCase();
    if (lower.includes('queue') || lower.includes('wait') || lower.includes('express')) return 'flash';
    if (lower.includes('vip') || lower.includes('luxury') || lower.includes('club')) return 'diamond';
    if (lower.includes('rated') || lower.includes('choice') || lower.includes('spa')) return 'sparkles';
    if (lower.includes('barber') || lower.includes('cut')) return 'cut';
    return 'sparkles';
  };

  // Category specific accent themes
  const themeColors = {
    men: {
      accent: '#2563EB',
      gradient: ['#1D4ED8', '#3B82F6'] as [string, string],
      glow: 'rgba(37, 99, 235, 0.3)',
      badgeBg: 'rgba(37, 99, 235, 0.9)',
    },
    womens: {
      accent: '#E11D48',
      gradient: ['#BE185D', '#FB7185'] as [string, string],
      glow: 'rgba(225, 29, 72, 0.3)',
      badgeBg: 'rgba(225, 29, 72, 0.9)',
    },
    kids: {
      accent: '#D97706',
      gradient: ['#B45309', '#F59E0B'] as [string, string],
      glow: 'rgba(217, 119, 6, 0.3)',
      badgeBg: 'rgba(217, 119, 6, 0.9)',
    },
  }[category] || {
    accent: '#2563EB',
    gradient: ['#1D4ED8', '#3B82F6'] as [string, string],
    glow: 'rgba(37, 99, 235, 0.3)',
    badgeBg: 'rgba(37, 99, 235, 0.9)',
  };

  // Fetch real premium shops from backend and merge with curated banners
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetchPremiumShops();
        const curated = DEFAULT_BANNER_DATA[category] || DEFAULT_BANNER_DATA.men;

        if (
          response?.success &&
          Array.isArray(response.premiumShops) &&
          response.premiumShops.length > 0
        ) {
          const apiBanners: BannerItem[] = response.premiumShops
            .filter(
              (shop: any) =>
                shop.ShopName && (shop.ProfileImage || shop.media?.length > 0)
            )
            .map((shop: any, idx: number) => {
              const img =
                shop.media?.[0]?.url || shop.ProfileImage || curated[0].imageUrl;
              return {
                id: shop._id || `api-shop-${idx}`,
                title: shop.ShopName.trim(),
                subtitle: 'Verified Premium Salon',
                tagline:
                  shop.Description ||
                  'Professional hair, beard & grooming by top stylists',
                badge: idx === 0 ? 'TOP CHOICE' : 'PREMIUM SALON',
                badgeIcon: (idx === 0 ? 'sparkles' : 'diamond') as keyof typeof Ionicons.glyphMap,
                rating: shop.rating ? Number(shop.rating).toFixed(1) : '4.8',
                location: shop.ExactLocation || shop.City || 'Nearby',
                timing: shop.Timing || '9 AM - 8 PM',
                discount: shop.discount ? `${shop.discount}% OFF` : 'EXCLUSIVE',
                imageUrl: img,
                shopId: shop._id,
                actionType: 'shop' as const,
                tags: ['Verified Salon', 'Instant Slot'],
              };
            });

          const combined = [...apiBanners.slice(0, 3), ...curated.slice(0, 2)];
          if (isMounted) {
            setBanners(combined);
            setActiveIndex(0);
          }
        } else {
          if (isMounted) {
            setBanners(curated);
            setActiveIndex(0);
          }
        }
      } catch (err) {
        console.log('Error loading banner data:', err);
        if (isMounted) {
          setBanners(DEFAULT_BANNER_DATA[category] || DEFAULT_BANNER_DATA.men);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [category]);

  // Auto-scroll carousel every 4.5 seconds when not paused
  useEffect(() => {
    if (banners.length <= 1 || isPaused || loading) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        try {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {}
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [banners.length, isPaused, loading]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (CARD_WIDTH + 12));
      if (index >= 0 && index < banners.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [banners.length, activeIndex]
  );

  const handlePressBanner = (item: BannerItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (onPressItem) {
      onPressItem(item);
      return;
    }

    if (item.shopId) {
      router.push({
        pathname: '/Screens/User/BarberShopFeed',
        params: { shop_id: item.shopId },
      });
    } else {
      router.push('/(tabs)/BookNow');
    }
  };

  const goToSlide = (idx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveIndex(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  const renderBannerItem = ({ item, index }: { item: BannerItem; index: number }) => {
    const slideGradients = getBannerGradient(index);
    const orbIcon = getBannerIcon(item);

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => handlePressBanner(item)}
          style={styles.touchableCard}
        >
          {/* Creative Clean Gradient Background - NO Background Image */}
          <LinearGradient
            colors={slideGradients}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Decorative geometric translucent shapes */}
          <View style={styles.decorativeOrb1} />
          <View style={styles.decorativeOrb2} />
          <View style={styles.decorativeOrb3} />

          {/* Inner Card Layout */}
          <View style={styles.cardInner}>
            {/* Left Content Area */}
            <View style={styles.leftColumn}>
              {/* Badges Row */}
              <View style={styles.badgeRow}>
                <View style={styles.glassBadge}>
                  <Ionicons
                    name={orbIcon}
                    size={11}
                    color="#FFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.glassBadgeText}>{item.badge}</Text>
                </View>

                {item.discount ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{item.discount}</Text>
                  </View>
                ) : null}
              </View>

              {/* Title & Tagline */}
              <View style={styles.textContainer}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.taglineText} numberOfLines={2}>
                  {item.tagline}
                </Text>
              </View>

              {/* Bottom CTA Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePressBanner(item)}
                  style={styles.bookCtaContainer}
                >
                  <Text style={styles.bookCtaText}>Book Slot</Text>
                  <Ionicons name="arrow-forward" size={11} color="#0F172A" />
                </TouchableOpacity>

                {item.location && (
                  <View style={styles.locationChip}>
                    <Ionicons
                      name="location-sharp"
                      size={10}
                      color="rgba(255, 255, 255, 0.8)"
                      style={{ marginRight: 3 }}
                    />
                    <Text style={styles.locationChipText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right Column Graphic: Glowing Glass Orb & Floating Rating */}
            <View style={styles.rightColumn}>
              <View style={styles.glassOrbOuter}>
                <View style={styles.glassOrbInner}>
                  <Ionicons name={orbIcon} size={28} color="#FFFFFF" />
                </View>
              </View>

              {item.rating ? (
                <View style={styles.ratingFloatingPill}>
                  <Ionicons name="star" size={10} color="#FBBF24" />
                  <Text style={styles.ratingFloatingText}>{item.rating}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && banners.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={themeColors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Horizontal Carousel */}
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBannerItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + 12}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMomentumScrollEnd={() => setIsPaused(false)}
        onScrollToIndexFailed={() => {}}
      />

      {/* Modern Expanding Segmented Indicator */}
      <View style={styles.indicatorContainer}>
        {banners.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => goToSlide(idx)}
              activeOpacity={0.7}
              style={[
                styles.indicatorDot,
                isActive
                  ? [styles.indicatorActive, { backgroundColor: themeColors.accent }]
                  : styles.indicatorInactive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    marginVertical: 8,
  },
  loaderContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 14,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  touchableCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeOrb1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeOrb2: {
    position: 'absolute',
    bottom: -40,
    right: 50,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeOrb3: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  glassBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  discountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  textContainer: {
    marginVertical: 2,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  taglineText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookCtaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  bookCtaText: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '700',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  locationChipText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  rightColumn: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glassOrbOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  glassOrbInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingFloatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2.5,
    marginTop: -8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingFloatingText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  indicatorDot: {
    height: 4,
    borderRadius: 2,
  },
  indicatorInactive: {
    width: 5,
    backgroundColor: '#CBD5E1',
  },
  indicatorActive: {
    width: 20,
  },
});
