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
    setTimeout(() => {
      onEndReachedCalled.current = false;
    }, 800);
  }, [hasMore, isLoadingMore, onEndReached]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#3B82F6';
    if (rating >= 4.0) return '#10B981';
    if (rating >= 3.5) return '#F59E0B';
    return '#EF4444';
  };

  const renderShopItem = ({ item, index }: { item: ShopItem; index: number }) => {
    const rating = item.rating || 4.5;
    const ratingColor = getRatingColor(rating);

    return (
      <TouchableOpacity
        style={{
          width: 200,
          marginRight: 16,
          backgroundColor: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#F0F0F0',
        }}
        onPress={() => handleShopPress(item)}
        activeOpacity={0.7}
      >
        {/* Image Container with Gradient Overlay */}
        <View style={{ position: 'relative', height: 130 }}>
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          
          {/* Gradient Overlay for better text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 50,
            }}
          />

          {/* Discount Badge */}
          {item.discount && (
            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: '#2563EB',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
                {item.discount}
              </Text>
            </View>
          )}

          {/* Rating Badge */}
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              backgroundColor: ratingColor,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="star" size={10} color="white" />
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
              {rating.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Content Container */}
        <View style={{ padding: 12 }}>
          {/* Shop Name and Verified Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 }} numberOfLines={1}>
              {item.name}
            </Text>
            {rating >= 4.0 && (
              <View style={{ marginLeft: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color="#2563EB" />
              </View>
            )}
          </View>

          {/* Cuisine/Categories */}
          {item.cuisine && (
            <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }} numberOfLines={1}>
              {item.cuisine.join(' • ')}
            </Text>
          )}

          {/* Location and Distance Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="location-outline" size={11} color="#9CA3AF" />
            <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4, flex: 1 }} numberOfLines={1}>
              {item.location}
            </Text>
            {item.distance && (
              <>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginHorizontal: 4 }}>•</Text>
                <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '500' }}>
                  {item.distance}
                </Text>
              </>
            )}
          </View>

          {/* Timing and Price Range Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={11} color="#9CA3AF" />
              <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>
                {item.timing || '9am - 8pm'}
              </Text>
            </View>
            
            {item.priceRange && (
              <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3].map((price) => (
                  <Text
                    key={price}
                    style={{
                      fontSize: 11,
                      color: parseInt(item.priceRange || '2') >= price ? '#2563EB' : '#E5E7EB',
                      fontWeight: '500',
                      marginLeft: 2,
                    }}
                  >
                    ₹
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#2563EB',
                paddingVertical: 8,
                borderRadius: 6,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 4,
              }}
              onPress={() => handleShopPress(item)}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>Book</Text>
              <Ionicons name="arrow-forward" size={10} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ width: 200, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
        <View
          style={{
            width: 200,
            height: 280,
            backgroundColor: 'white',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#F0F0F0',
          }}
        >
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontWeight: '400' }}>
            Loading more...
          </Text>
        </View>
      </View>
    );
  };

  if (shops.length === 0 && !isLoadingMore) return null;

  return (
    <View style={{ marginVertical: 16 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 3,
              height: 20,
              backgroundColor: '#2563EB',
              borderRadius: 1.5,
              marginRight: 8,
            }}
          />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>
            {title}
          </Text>
        </View>

        {onViewAll && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F9FAFB',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: '#F0F0F0',
            }}
            onPress={onViewAll}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#4B5563', marginRight: 4 }}>
              View All
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#4B5563" />
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
        onEndReachedThreshold={0.35}
        ListFooterComponent={renderFooter}
        ListFooterComponentStyle={{
          marginRight: 0,
          alignSelf: 'center',
        }}
        bounces={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: 216,
          offset: 216 * index,
          index,
        })}
        decelerationRate="fast"
        snapToInterval={216}
        snapToAlignment="start"
      />
    </View>
  );
};

export default ShopCarousel;