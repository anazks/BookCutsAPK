// Screens/User/ShopCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
          <Ionicons name="sparkles" size={12} color="#92400E" />
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
        {/* Subtle Gradient Overlay */}
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
          <Ionicons name="location" size={14} color="#6366F1" style={styles.icon} />
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
          <Ionicons name="time-outline" size={14} color="#10B981" style={styles.icon} />
          <Text style={styles.timingText} numberOfLines={1}>
            {timing}
          </Text>
        </View>
      </View>

      {/* Arrow Indicator */}
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.arrow} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
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
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    letterSpacing: -0.25,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
    width: 20,
  },
  locationContainer: {
    flex: 1,
  },
  locationMain: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 1,
  },
  locationSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  timingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
    flex: 1,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  arrow: {
    alignSelf: 'center',
    marginLeft: 4,
  },
});

export default ShopCard;