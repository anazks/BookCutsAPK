import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPlatformOffers, Offer } from '../../api/Service/Shop';

const { width } = Dimensions.get('window');

const PlatformOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const response = await getPlatformOffers();
      if (response?.success && response?.data) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error('Error fetching platform offers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const getGradient = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#667EEA', '#764BA2'],
      ['#F093FB', '#F5576C'],
      ['#43E97B', '#38F9D7'],
      ['#FA709A', '#FEE140'],
      ['#5EE7DF', '#B490FF'],
    ];
    return gradients[index % gradients.length];
  };

  const getIcon = (offer: Offer) => {
    if (offer.offerType === 'discount') return '✂️';
    return '🎉';
  };

  const renderOfferCard = ({ item, index }: { item: Offer; index: number }) => {
    const validDate = new Date(item.validUntil).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.cardContainer}>
        <LinearGradient
          colors={getGradient(index)}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.footer}>
                {!!item.discountValue && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.discountType === 'percentage' ? `${item.discountValue}%` : `₹${item.discountValue}`} OFF
                    </Text>
                  </View>
                )}
                <Text style={styles.validity}>
                  Until {validDate}
                </Text>
              </View>
            </View>
            <Text style={styles.icon}>{getIcon(item)}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (offers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Special Announcements</Text>
      </View>
      <FlatList
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={width * 0.76 + 12}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 14,
  },
  cardContainer: {
    width: width * 0.76,
    marginRight: 12,
  },
  gradient: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 10,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  validity: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.78)',
  },
  icon: {
    fontSize: 36,
    marginLeft: 10,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlatformOffers;
