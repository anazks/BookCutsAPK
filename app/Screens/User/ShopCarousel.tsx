import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

const ShopCard = ({ item, index, total, onPress }: {
  item: ShopItem;
  index: number;
  total: number;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginRight: index === total - 1 ? 20 : 14,
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          width: 170,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Image */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: 110 }}
            resizeMode="cover"
          />

          {/* Gradient overlay on image */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 55,
            }}
          />

          {/* Rating badge — top left */}
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(10,10,10,0.75)',
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.4)',
            }}
          >
            <Ionicons name="star" size={9} color="#D4AF37" />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#D4AF37',
                marginLeft: 3,
                letterSpacing: 0.3,
              }}
            >
              {item.rating?.toFixed(1) || '4.5'}
            </Text>
          </View>

          {/* Distance badge — top right */}
          {item.distance && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(10,10,10,0.75)',
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: 0.3,
                }}
              >
                {item.distance}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ padding: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: 5,
              letterSpacing: 0.1,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="location-outline" size={11} color="rgba(212,175,55,0.7)" />
            <Text
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                marginLeft: 4,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.location || item.city || 'Unknown Location'}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(212,175,55,0.15)',
              marginBottom: 10,
            }}
          />

          {/* Footer row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {item.timing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.3)" />
                <Text
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    marginLeft: 3,
                  }}
                >
                  {item.timing}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {/* Arrow button */}
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: 'rgba(212,175,55,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(212,175,55,0.35)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-forward" size={13} color="#D4AF37" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ShopCarousel: React.FC<ShopCarouselProps> = ({
  title,
  shops,
  onViewAll,
  onEndReached,
  isLoadingMore = false,
  hasMore = true,
}) => {
  const flatListRef = useRef<FlatList>(null);

  const handleShopPress = (shop: ShopItem) => {
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop.id },
    });
  };

  const handleLoadMore = () => {
    if (onEndReached && !isLoadingMore && hasMore) {
      onEndReached();
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View
        style={{
          width: 170,
          height: 196,
          marginRight: 20,
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(212,175,55,0.2)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color="#D4AF37" />
        <Text
          style={{
            marginTop: 10,
            fontSize: 10,
            color: 'rgba(212,175,55,0.7)',
            letterSpacing: 1.5,
            fontWeight: '600',
          }}
        >
          LOADING...
        </Text>
      </View>
    );
  };

  if (shops.length === 0 && !isLoadingMore) return null;

  return (
    <View style={{ marginVertical: 20 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingHorizontal: 20,
          marginBottom: 14,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#FFFFFF',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: 'rgba(212,175,55,0.8)',
              marginTop: 2,
              letterSpacing: 1.5,
              fontWeight: '700',
            }}
          >
            NEAR YOU
          </Text>
        </View>

        {onViewAll && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(212,175,55,0.1)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.3)',
              gap: 4,
            }}
            onPress={onViewAll}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#D4AF37',
                letterSpacing: 0.5,
              }}
            >
              View All
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#D4AF37" />
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        horizontal
        data={shops}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }}
        renderItem={({ item, index }) => (
          <ShopCard
            item={item}
            index={index}
            total={shops.length}
            onPress={() => handleShopPress(item)}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: 184,   // 170 card + 14 gap
          offset: 184 * index,
          index,
        })}
      />
    </View>
  );
};

export default ShopCarousel;