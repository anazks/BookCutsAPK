import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHOP_ADS = [
  {
    id: '1',
    shopName: 'Elite Barbershop',
    tagline: 'Premium Grooming Experience',
    discount: '30% OFF',
    description: 'On all haircut services',
    image: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg',
    rating: 4.8,
    reviews: 124,
    distance: '1.2 km',
    color: '#FF6B6B',
  },
  {
    id: '2',
    shopName: 'Beard & Co.',
    tagline: 'Specialized Beard Care',
    discount: 'BUY 1 GET 1',
    description: 'Beard grooming packages',
    image: 'https://images.pexels.com/photos/3993467/pexels-photo-3993467.jpeg',
    rating: 4.9,
    reviews: 156,
    distance: '3.1 km',
    color: '#3B82F6',
  },
  {
    id: '3',
    shopName: 'Modern Men Salon',
    tagline: 'Trendy Styles & Cuts',
    discount: '50% OFF',
    description: 'First time customers',
    image: 'https://images.pexels.com/photos/897270/pexels-photo-897270.jpeg',
    rating: 4.6,
    reviews: 89,
    distance: '2.5 km',
    color: '#10B981',
  },
];

export default function ShopCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => {
        const newIndex = (prev + 1) % SHOP_ADS.length;
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        return newIndex;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const renderShopCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          
          {/* Discount Badge */}
          <View style={[styles.discountBadge, { backgroundColor: item.color }]}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>

          {/* Overlay Info */}
          <View style={styles.infoContainer}>
            {/* Shop Name & Rating */}
            <View style={styles.headerRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.shopName}>{item.shopName}</Text>
                <Text style={styles.tagline}>{item.tagline}</Text>
              </View>
              
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>

            {/* Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color="#D1D5DB" />
                <Text style={styles.detailText}>{item.distance}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color="#D1D5DB" />
                <Text style={styles.detailText}>{item.reviews} reviews</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>

            {/* Book Button */}
            <TouchableOpacity 
              style={[styles.bookButton, { backgroundColor: item.color }]}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SHOP_ADS}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 20,
  },
  carousel: {
    flex: 1,
  },
  cardContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    height: 350,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#F3F4F6',
    lineHeight: 20,
    marginBottom: 16,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});