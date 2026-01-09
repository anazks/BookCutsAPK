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
    color: '#EF4444', // Changed to theme red
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
    color: '#EF4444', // Changed to theme red
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
    color: '#EF4444', // Changed to theme red
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
    const index = Math.round(contentOffsetX / (SCREEN_WIDTH - 32));
    setActiveIndex(index);
  };

  const renderShopCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          
          {/* Discount Badge - Theme matched */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>

          {/* Overlay Info */}
          <View style={styles.infoContainer}>
            {/* Shop Name & Tagline */}
            <View style={styles.nameContainer}>
              <Text style={styles.shopName}>{item.shopName}</Text>
              <Text style={styles.tagline}>{item.tagline}</Text>
            </View>

            {/* Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                <Text style={styles.detailText}>{item.distance}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color="#9CA3AF" />
                <Text style={styles.detailText}>{item.reviews} reviews</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>

            {/* Book Button */}
            <TouchableOpacity 
              style={styles.bookButton}
              activeOpacity={0.7}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // Pagination Dots
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {SHOP_ADS.map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.paginationDot,
            activeIndex === index && styles.activePaginationDot
          ]} 
        />
      ))}
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
        snapToInterval={SCREEN_WIDTH - 32}
        decelerationRate="fast"
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
  carousel: {
    flexGrow: 0,
  },
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: 8,
    height: 240, // Matched with Home's shop card proportions
  },
  card: {
    flex: 1,
    borderRadius: 8, // Matched border radius
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Theme border color
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
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444', // Theme red
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12, // Slightly rounded like theme
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  nameContainer: {
    marginBottom: 8,
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
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF', // Theme tertiary color
    fontWeight: '400',
  },
  description: {
    fontSize: 13,
    color: '#F3F4F6',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '400',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
    backgroundColor: '#EF4444', // Theme red
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
    backgroundColor: '#EF4444', // Theme red
  },
});