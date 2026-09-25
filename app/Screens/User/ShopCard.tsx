// Screens/User/ShopCard.tsx
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface ShopCardProps {
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
    rating?: number | string;
    distance?: string;
    distanceText?: string;
  };
  onPress?: () => void;
  onBook?: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onPress, onBook }) => {
  const cleanImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80';
    return url.replace(/^<|>$/g, '').trim();
  };

  const imageUri = cleanImageUrl(shop.ProfileImage || shop.image);
  const shopName = (shop.ShopName || shop.name || 'Unknown Salon').trim();
  const city = shop.City || shop.city || '';
  const location = shop.ExactLocation || city || 'Location not specified';
  const timing = shop.Timing || shop.timing || '9:00 AM - 8:00 PM';
  const rating = shop.rating ? Number(shop.rating).toFixed(1) : '4.8';
  const distance = shop.distanceText || shop.distance || '';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* ── Left: Thumbnail with Badges ── */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Premium Pill */}
        {shop.IsPremium && (
          <View style={styles.premiumTag}>
            <Ionicons name="sparkles" size={9} color="#FFFFFF" />
            <Text style={styles.premiumTagText}>PRO</Text>
          </View>
        )}

        {/* Distance Chip */}
        {!!distance && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}
      </View>

      {/* ── Center: Shop Details ── */}
      <View style={styles.content}>
        {/* Top: Name & Rating */}
        <View style={styles.headerRow}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName}
          </Text>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        {/* Location with Pin */}
        <View style={styles.infoRow}>
          <Ionicons name="location-sharp" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {/* Timing with Green Status Dot */}
        <View style={styles.statusRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>Open</Text>
          <Text style={styles.timingDot}>•</Text>
          <Text style={styles.timingText} numberOfLines={1}>
            {timing}
          </Text>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <Text style={styles.serviceHint}>Instant Chair Booking</Text>
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.8}
            onPress={onBook || onPress}
          >
            <Text style={styles.bookButtonText}>Book Slot</Text>
            <Ionicons name="arrow-forward" size={12} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 14,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  imageContainer: {
    width: 90,
    height: 94,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  premiumTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  premiumTagText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
  },
  shopName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    letterSpacing: -0.3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '700',
  },
  timingDot: {
    marginHorizontal: 5,
    color: '#CBD5E1',
    fontSize: 11,
  },
  timingText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 6,
  },
  serviceHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  bookButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
});

export default ShopCard;