// Screens/User/ShopCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShopCardProps {
  shop: {
    _id?: string;
    ShopName?: string;
    ProfileImage?: string;
    ExactLocation?: string;
    City?: string;
    Timing?: string;
    IsPremium?: boolean;
    name?: string;
    image?: string;
    city?: string;
    timing?: string;
  };
  onPress?: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onPress }) => {
  // Clean ProfileImage: remove < > brackets if present
  const cleanImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/100';
    return url.replace(/^<|>$/g, '').trim();
  };

  const imageUri = cleanImageUrl(shop.ProfileImage || shop.image);
  const shopName = (shop.ShopName || shop.name || 'Unknown Shop').trim();
  const city = shop.City || shop.city || 'Unknown City';
  const location = shop.ExactLocation || city;
  const timing = shop.Timing || shop.timing || 'Timings unavailable';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {/* Premium Badge - Positioned over image */}
      {shop.IsPremium && (
        <View style={styles.premiumBadge}>
          <Ionicons name="sparkles" size={12} color="#000" />
          <Text style={styles.premiumText}>PREMIUM</Text>
        </View>
      )}

      {/* Shop Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          defaultSource={{ uri: 'https://via.placeholder.com/100' }}
        />
        {/* Gradient Overlay */}
        <View style={styles.imageOverlay} />
      </View>

      {/* Content Container */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName}
          </Text>
          <View style={styles.statusIndicator} />
        </View>

        {/* Location Section */}
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#4F46E5" style={styles.icon} />
          <View style={styles.locationContainer}>
            <Text style={styles.locationMain} numberOfLines={1}>
              {location}
            </Text>
            <Text style={styles.locationSub} numberOfLines={1}>
              {city}
            </Text>
          </View>
        </View>

        {/* Timing Section */}
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#10B981" style={styles.icon} />
          <Text style={styles.timingText} numberOfLines={1}>
            {timing}
          </Text>
        </View>

        {/* Decorative Accent Line */}
        <View style={styles.accentLine} />
      </View>

      {/* Arrow Indicator */}
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" style={styles.arrow} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'capitalize',
    flex: 1,
    letterSpacing: -0.5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  locationContainer: {
    flex: 1,
  },
  locationMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  locationSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  timingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    flex: 1,
  },
  premiumBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    marginLeft: 4,
    letterSpacing: 1,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4F46E5',
    opacity: 0.3,
    borderRadius: 1,
  },
  arrow: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});

export default ShopCard;