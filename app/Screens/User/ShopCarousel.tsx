import React, { useRef, useState, useCallback } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
}

interface ShopCarouselProps {
  title: string;
  shops: ShopItem[];
  onViewAll?: () => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

const ShopCarousel: React.FC<ShopCarouselProps> = ({
  title,
  shops,
  onViewAll,
  onEndReached,
  isLoadingMore = false,
  hasMore = true,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const onEndReachedCalled = useRef(false); // simple guard against spam calls

  const handleShopPress = (shop: ShopItem) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id },
    });
  };

  const handleLoadMore = useCallback(() => {
    // Extra safety: only call once per "session" until reset
    if (!hasMore || isLoadingMore || onEndReachedCalled.current) return;

    onEndReachedCalled.current = true;
    onEndReached?.();

    // Reset flag after a short delay (helps if parent fetch is slow)
    setTimeout(() => {
      onEndReachedCalled.current = false;
    }, 800);
  }, [hasMore, isLoadingMore, onEndReached]);

  const renderShopItem = ({ item, index }: { item: ShopItem; index: number }) => (
    <TouchableOpacity
      style={{
        width: 160,
        marginRight: 16, // consistent margin (last item also has margin)
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
      onPress={() => handleShopPress(item)}
      activeOpacity={0.9}
    >
      {/* ... same image + rating badge ... */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: '100%', height: 100 }}
          resizeMode="cover"
        />
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 20,
          }}
        >
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#111827', marginLeft: 2 }}>
            {item.rating?.toFixed(1) || '4.5'}
          </Text>
        </View>
      </View>

      <View style={{ padding: 12 }}>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 }} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            paddingTop: 8,
          }}
        >
          <TouchableOpacity
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#ECFDF5',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ width: 160, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 160,
            height: 188, // fixed height matching card → prevents layout jump
            backgroundColor: 'white',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#F3F4F6',
          }}
        >
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>Loading more...</Text>
        </View>
      </View>
    );
  };

  if (shops.length === 0 && !isLoadingMore) return null;

  return (
    <View style={{ marginVertical: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>
          {title}
        </Text>

        {onViewAll && (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={onViewAll}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981', marginRight: 4 }}>
              View All
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#10B981" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        horizontal
        data={shops}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={renderShopItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}           // ← lowered + tuned for horizontal
        ListFooterComponent={renderFooter}
        ListFooterComponentStyle={{           // ← very important
          marginRight: 16,                     // consistent spacing
          alignSelf: 'center',
        }}
        bounces={false}                        // ← helps a lot on iOS (prevents double calls)
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}                         // slightly higher for horizontal
        getItemLayout={(data, index) => ({
          length: 176, // card width 160 + marginRight 16
          offset: 176 * index,
          index,
        })}
      />
    </View>
  );
};

export default ShopCarousel;  