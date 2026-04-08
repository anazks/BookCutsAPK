import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface ShopItem {
  id: string;
  name: string;
  location: string;
  distance?: string;
  city?: string;
  timing?: string;
  mobile?: string;
  website?: string;
  image: string;
  rating?: number;
  priceRange?: string;
  isOpen?: boolean;
  discount?: string;
  cuisine?: string[];
  isPremium?: boolean;
}

interface ShopCarouselProps {
  title: string;
  shops: ShopItem[];
  onViewAll?: () => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

const CARD_WIDTH = 186;
const CARD_GAP = 12;

const ShopCarousel: React.FC<ShopCarouselProps> = ({
  title,
  shops,
  onViewAll,
  onEndReached,
  isLoadingMore = false,
  hasMore = true,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const onEndReachedCalled = useRef(false);

  const handleShopPress = (shop: ShopItem) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id },
    });
  };

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || onEndReachedCalled.current) return;
    onEndReachedCalled.current = true;
    onEndReached?.();
    setTimeout(() => { onEndReachedCalled.current = false; }, 800);
  }, [hasMore, isLoadingMore, onEndReached]);

  const renderShopItem = ({ item }: { item: ShopItem }) => {
    const isOpen = item.isOpen !== false;

    return (
      <TouchableOpacity
        style={{
          width: CARD_WIDTH,
          marginRight: CARD_GAP,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={() => handleShopPress(item)}
        activeOpacity={0.82}
      >
        {/* Image */}
        <View style={{ height: 118, position: 'relative' }}>
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.45)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56 }}
          />

          {/* Discount badge */}
          {item.discount && (
            <View
              style={{
                position: 'absolute',
                top: 9,
                left: 9,
                backgroundColor: '#2563EB',
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
                {item.discount}
              </Text>
            </View>
          )}

          {/* Premium Badge */}
          {item.isPremium && (
            <View
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: '#F59E0B',
                paddingHorizontal: 6,
                paddingVertical: 4,
                borderRadius: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Ionicons name="star" size={10} color="white" />
              <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
                PREMIUM
              </Text>
            </View>
          )}
        </View>

          {/* Open/Closed pill */}
          <View
            style={{
              position: 'absolute',
              top: 9,
              right: 9,
              backgroundColor: isOpen ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.85)',
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 }}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>

          {/* Distance badge - bottom right over gradient */}
          {item.distance && (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                right: 9,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Ionicons name="navigate-outline" size={10} color="#93C5FD" />
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>
                {item.distance}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 11 }}>
          {/* Name */}
          <Text
            style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 3, letterSpacing: -0.2 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {/* Cuisine tags */}
          {item.cuisine && (
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 5 }} numberOfLines={1}>
              {item.cuisine.join(' · ')}
            </Text>
          )}

          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="location-outline" size={10} color="#94A3B8" />
            <Text style={{ fontSize: 10, color: '#64748B', marginLeft: 3, flex: 1 }} numberOfLines={1}>
              {item.location || item.city || '—'}
            </Text>
          </View>

          {/* Timing + Price row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="time-outline" size={10} color="#94A3B8" />
              <Text style={{ fontSize: 10, color: '#64748B' }}>
                {item.timing || '9am – 8pm'}
              </Text>
            </View>
            {item.priceRange && (
              <View style={{ flexDirection: 'row', gap: 1 }}>
                {[1, 2, 3].map((p) => (
                  <Text
                    key={p}
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: parseInt(item.priceRange || '2') >= p ? '#2563EB' : '#E2E8F0',
                    }}
                  >
                    ₹
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Book button */}
          <TouchableOpacity
            onPress={() => handleShopPress(item)}
            activeOpacity={0.85}
            style={{ borderRadius: 10, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 }}>
                Book Now
              </Text>
              <Ionicons name="arrow-forward" size={10} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View
        style={{
          width: CARD_WIDTH,
          height: 260,
          backgroundColor: '#FFF',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          marginRight: CARD_GAP,
        }}
      >
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={{ marginTop: 8, fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>
          Loading...
        </Text>
      </View>
    );
  };

  if (shops.length === 0 && !isLoadingMore) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 14,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 3,
              height: 16,
              backgroundColor: '#2563EB',
              borderRadius: 2,
            }}
          />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 }}>
            {title}
          </Text>
        </View>

        {onViewAll && (
          <TouchableOpacity
            onPress={onViewAll}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              backgroundColor: '#EFF6FF',
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#2563EB' }}>See All</Text>
            <Ionicons name="arrow-forward" size={11} color="#2563EB" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        horizontal
        data={shops}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14 }}
        renderItem={renderShopItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={renderFooter}
        bounces={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + CARD_GAP,
          offset: (CARD_WIDTH + CARD_GAP) * index,
          index,
        })}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      />
    </View>
  );
};

export default ShopCarousel;