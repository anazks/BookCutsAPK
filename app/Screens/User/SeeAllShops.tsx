import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList
} from 'react-native';
// Import the API service function
import { getAllShops } from '../../api/Service/Shop';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const SeeAllShops = () => {
  const insets = useSafeAreaInsets();
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAllShops = async () => {
      try {
        setLoading(true);
        const result = await getAllShops();
        console.log("All shops API response:", result);
       
        if (result && result.success) {
          const shopsData = result.data || [];
          setShops(shopsData);
          setFilteredShops(shopsData);
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

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop =>
        shop.ShopName?.toLowerCase().includes(text.toLowerCase()) ||
        shop.City?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredShops(filtered);
    }
  };

  const handleShopPress = (shop) => {
    console.log('Shop pressed:', shop);
    router.push({
      pathname: '/Screens/User/BarberShopFeed',
      params: { shop_id: shop._id }
    });
  };

  const renderShopCard = ({ item, index }) => {
    const profileImageUrl = item.ProfileImage || 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleShopPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: profileImageUrl }} 
              style={styles.shopImage}
              resizeMode="cover"
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>

          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>
              {item.ShopName || 'Unknown Shop'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color="#666" />
              <Text style={styles.cityText} numberOfLines={1}>
                {item.City || 'Unknown City'}
              </Text>
            </View>
            <View style={styles.servicesBadge}>
              <Ionicons name="cut-outline" size={11} color="#FF6B6B" />
              <Text style={styles.servicesText}>
                Services Available
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Loading shops...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Discover Shops</Text>
        <Text style={styles.headerSubtitle}>
          {shops.length} shop{shops.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops or location..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Shop Grid */}
      {filteredShops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No shops found' : 'No shops available'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>
              Try searching with different keywords
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  clearButton: {
    padding: 4,
  },
  gridContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  shopImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 3,
  },
  shopInfo: {
    gap: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  servicesBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicesText: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#333',
    borderRadius: 24,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SeeAllShops;