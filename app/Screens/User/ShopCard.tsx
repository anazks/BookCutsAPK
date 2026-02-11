import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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
    rating?: number;
  };
  onPress?: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onPress }) => {
  const cleanImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300/1A1A1A/D4AF37?text=Shop';
    return url.replace(/^<|>$/g, '').trim();
  };

  const imageUri = cleanImageUrl(shop.ProfileImage || shop.image);
  const shopName = (shop.ShopName || shop.name || 'Unknown Shop').trim();
  const city = shop.City || shop.city || 'Unknown City';
  const location = shop.ExactLocation || city;
  const timing = shop.Timing || shop.timing || 'Timings unavailable';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {/* Elite Badge - Floats slightly over the top */}
      {shop.IsPremium && (
        <View style={styles.eliteBadge}>
          <FontAwesome5 name="crown" size={10} color="#000" />
          <Text style={styles.eliteText}>ELITE</Text>
        </View>
      )}

      {/* Image Section with a Gold Inner Glow effect */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>

      {/* Info Section */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#D4AF37" />
            <Text style={styles.ratingText}>{shop.rating || '4.5'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoBody}>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-pin" size={14} color="#D4AF37" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={13} color="rgba(212, 175, 55, 0.6)" />
            <Text style={styles.timingText} numberOfLines={1}>
              {timing}
            </Text>
          </View>
        </View>
      </View>

      {/* Sleek Golden Action Icon */}
      <View style={styles.actionContainer}>
        <View style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={16} color="#000" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#0F0F0F', // Deeper black
    borderRadius: 24,
    marginVertical: 10,
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262626', // Darker border
    // Premium shadow
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
  },
  eliteBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  eliteText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    marginLeft: 5,
    letterSpacing: 1.2,
  },
  imageWrapper: {
    width: 95,
    height: 95,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2F2F2',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#262626',
    width: '40%',
    marginVertical: 6,
  },
  infoBody: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#A3A3A3',
    fontWeight: '500',
    flex: 1,
  },
  timingText: {
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.7)',
    fontWeight: '600',
  },
  actionContainer: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShopCard;