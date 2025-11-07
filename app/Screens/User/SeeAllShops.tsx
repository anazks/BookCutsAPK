import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';

// Import the API service function
import { getAllShops } from '../../api/Service/Shop';

const SeeAllShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllShops = async () => {
      try {
        setLoading(true);
        const result = await getAllShops();
        console.log("All shops API response:", result);
        
        if (result && result.success) {
          setShops(result.data || []);
          setError(null);
        } else {
          console.log("Error fetching all shops:", result);
          setError("Failed to fetch all shops. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching all shops:", error);
        setError("Failed to load shops. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllShops();
  }, []);

  const handleShopPress = (shop) => {
    console.log('Shop pressed:', shop);
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop._id }
    });
  };

  const renderShopCard = ({ item }) => {
    const firstImageUrl = item.media && item.media.length > 0 
      ? (item.media[0].url || item.media[0].url?.join(''))
      : 'https://via.placeholder.com/160x100?text=No+Image';

    return (
      <TouchableOpacity style={styles.shopCard} onPress={() => handleShopPress(item)}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: firstImageUrl }} 
            style={styles.shopImage} 
            resizeMode="cover"
          />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFF" />
            <Text style={styles.ratingBadgeText}>4.5</Text>
          </View>
        </View>
        <View style={styles.shopDetails}>
          <Text style={styles.shopName} numberOfLines={1}>{item.ShopName || 'Unknown Shop'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#999" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.City || 'Unknown City'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRow = (rowShops) => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={rowShops}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.rowContainer}
      renderItem={renderShopCard}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading shops...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#CCC" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (shops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={64} color="#E0E0E0" />
        <Text style={styles.emptyText}>No shops available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Popular Shops</Text>
        {renderRow(shops)}
        
        <Text style={styles.sectionTitle}>Near You</Text>
        {renderRow(shops)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 24,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#FAFAFA',
  },
  emptyText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    marginLeft: 20,
    letterSpacing: -0.3,
  },
  rowContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  shopCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    height: 100,
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  shopDetails: {
    padding: 12,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
    flex: 1,
  },
});

export default SeeAllShops;