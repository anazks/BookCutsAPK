import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getShopById } from '../../api/Service/Shop';

const { width: screenWidth } = Dimensions.get('window');

const BarberShopFeed = () => {
  const { shop_id } = useLocalSearchParams();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const offerScrollRef = useRef(null);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  // Static offers data
  const offers = [
    {
      id: '1',
      title: '20% OFF First Visit',
      description: 'New customers get 20% off on all services',
      code: 'FIRST20',
      validUntil: '2025-10-31',
      gradient: ['#FF6B6B', '#FF8E8E'],
    },
    {
      id: '2',
      title: 'Free Beard Trim',
      description: 'Get free beard trim with any haircut service',
      code: 'BEARDTRIM',
      validUntil: '2025-09-30',
      gradient: ['#4ECDC4', '#44A08D'],
    },
    {
      id: '3',
      title: 'Weekend Special',
      description: '15% off on weekend bookings',
      code: 'WEEKEND15',
      validUntil: '2025-12-31',
      gradient: ['#A8E6CF', '#7FDBDA'],
    },
    {
      id: '4',
      title: 'Student Discount',
      description: '25% off for students with valid ID',
      code: 'STUDENT25',
      validUntil: '2025-12-31',
      gradient: ['#FFD93D', '#FF9A00'],
    }
  ];

  // Fetch shop data from API
  const fetchShopData = async () => {
    if (!shop_id) {
      setError('Shop ID not provided');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getShopById(shop_id);
      console.log(JSON.stringify(response, null, 2))
      if (response && response.success && response.data && response.data.length > 0) {
        setShopData(response.data[0]);
        setError(null);
      } else {
        setError('Failed to fetch shop data');
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
      setError('Failed to load shop information');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll offers banner
  useEffect(() => {
    const interval = setInterval(() => {
      if (offerScrollRef.current && offers.length > 0) {
        const nextIndex = (currentOfferIndex + 1) % offers.length;
        try {
          offerScrollRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setCurrentOfferIndex(nextIndex);
        } catch (error) {
          console.log('Auto-scroll error:', error);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentOfferIndex, offers.length]);

  // Fetch shop data on component mount
  useEffect(() => {
    fetchShopData();
  }, [shop_id]);

  const handleMediaPress = (media) => {
    setSelectedMedia(media);
    setModalVisible(true);
  };

  const handleShareMedia = async () => {
    if (selectedMedia?.uri) {
      try {
        const shareOptions = {
          message: `Check out this from ${shopData?.ShopName || 'Barber Shop'}: ${selectedMedia.caption || ''}`,
          url: selectedMedia.uri,
        };
        await Share.share(shareOptions);
      } catch (error) {
        // Fallback to WhatsApp if Share fails
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareOptions.message)}&attach=${selectedMedia.uri}`;
        Linking.openURL(whatsappUrl).catch(() => console.log('Sharing failed'));
      }
    }
  };

  const handleBookNow = () => {
    console.log('Book Now pressed for:', shopData?.ShopName || 'Unknown Shop');
    router.push({
      pathname: '/Screens/User/BookNow',
      params: { shop_id: shop_id }
    })
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
  };

  // Render feed item for the vertical feed
  const renderFeedItem = (item) => {
    let imageUrl = item.url;
    if (!imageUrl && typeof item === 'object' && !Array.isArray(item)) {
      const urlChars = Object.keys(item)
        .filter(key => !isNaN(parseInt(key)) && key !== '_id')
        .map(key => item[key])
        .join('');
      imageUrl = urlChars;
    }
    const caption = item.title || item.description || 'No caption';
    return (
      <View style={styles.feedItemContainer} key={item._id || item.id}>
        <View style={styles.feedHeader}>
          <View style={styles.feedAvatar} />
          <View style={styles.feedUserInfo}>
            <Text style={styles.feedShopName}>{shopData.ShopName || 'Barber Shop'}</Text>
            {/* <Text style={styles.feedTimestamp}>2 hours ago</Text> */}
          </View>
        </View>
        <TouchableOpacity
          style={styles.feedMedia}
          onPress={() => handleMediaPress({ uri: imageUrl, caption, type: 'image' })}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.feedImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.feedFooter}>
          <Text style={styles.feedCaption} numberOfLines={2}>{caption}</Text>
          {/* <Text style={styles.feedTimestampFooter}>2 HOURS AGO</Text> */}
        </View>
      </View>
    );
  };

  const renderOfferCard = ({ item }) => (
    <View style={[styles.offerCard, { backgroundColor: item.gradient[0] }]}>
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerDescription}>{item.description}</Text>
        <View style={styles.offerCodeContainer}>
          <Text style={styles.offerCode}>Code: {item.code}</Text>
        </View>
        <Text style={styles.offerValidity}>Valid until {item.validUntil}</Text>
      </View>
      <View style={styles.offerIcon}>
        <Ionicons name="gift" size={24} color="#FFF" />
      </View>
    </View>
  );

  // Render header section
  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.profileImageContainer}>
        {shopData?.ProfileImage ? (
          <Image
            source={{ uri: shopData.ProfileImage }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.placeholderText}>
              {shopData?.ShopName?.charAt(0) || 'S'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.shopDetails}>
        <Text style={styles.shopName}>{shopData?.ShopName || 'Shop Name'}</Text>
        <View style={styles.shopMetaRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Open</Text>
          </View>
        </View>
        <View style={styles.shopDetailsRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color="#888" /> {shopData?.ExactLocation}, {shopData?.City || 'Unknown City'}
          </Text>
          {shopData?.Timing && (
            <Text style={styles.timingText}>
              <Ionicons name="time-outline" size={14} color="#888" /> {shopData.Timing}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  // Render offers section
  const renderOffers = () => (
    <View style={styles.offersBannerContainer}>
      <Text style={styles.offersBannerTitle}>Special Offers</Text>
      <FlatList
        ref={offerScrollRef}
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.offersContainer}
        snapToInterval={screenWidth * 0.8 + 12}
        decelerationRate="fast"
      />
    </View>
  );

  // Render empty feed state
  const renderEmptyFeed = () => (
    <View style={styles.emptyFeedContainer}>
      <Ionicons name="image-outline" size={48} color="#CCC" />
      <Text style={styles.emptyFeedText}>No media available yet</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchShopData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!shopData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Shop not found</Text>
      </View>
    );
  }

  // Main list data
  const listData = [
    { type: 'header', id: 'header' },
    { type: 'offers', id: 'offers' },
    ...((shopData.media || []).map(item => ({ ...item, type: 'media' })))
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return renderHeader();
      case 'offers':
        return renderOffers();
      case 'media':
        return renderFeedItem(item);
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={renderEmptyFeed}
      />

      {/* Floating Book Now Button */}
      <TouchableOpacity
        style={styles.floatingBookButton}
        onPress={handleBookNow}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>Book Now</Text>
        <Ionicons name="calendar" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Media Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMedia?.caption || 'Media Preview'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalMediaContainer}>
              {selectedMedia && (
                <>
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  {selectedMedia.type === 'video' && (
                    <TouchableOpacity
                      style={styles.modalPlayButton}
                      onPress={() => console.log('Play video')}
                    >
                      <View style={styles.playButtonLarge}>
                        <Ionicons name="play" size={32} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
            <View style={styles.modalActions}>
              {/* <TouchableOpacity style={styles.modalActionButton} onPress={handleShareMedia}>
                <Ionicons name="share-social-outline" size={20} color="#FF6B6B" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Header Section with Profile on Left and Details on Right
  headerSection: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  shopDetails: {
    flex: 1,
    marginTop: 8,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  ratingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 15,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: '#FFF',
  },
  openText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },
  shopDetailsRow: {
    flexDirection: 'column',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flexShrink: 1,
  },
  timingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  // Offers Banner Styles
  offersBannerContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  offersBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  offersContainer: {
    paddingLeft: 20,
  },
  offerCard: {
    width: screenWidth * 0.8,
    marginRight: 12,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    lineHeight: 18,
  },
  offerCodeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  offerCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  offerValidity: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  offerIcon: {
    marginLeft: 12,
  },
  // Scroll Container Styles
  scrollContent: {
    paddingBottom: 100,
  },
  // Feed Item Styles
  feedListContainer: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  feedItemContainer: {
    marginBottom: 2,
    backgroundColor: '#FFF',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    marginRight: 12,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedShopName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  feedTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  feedMoreButton: {
    padding: 4,
  },
  feedMedia: {
    width: '100%',
    height: 400,
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedCaption: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  feedTimestampFooter: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  // Empty Feed State
  emptyFeedContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyFeedText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  // Floating Button
  floatingBookButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: '80%',
    width: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalMediaContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: '#000',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  playButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  modalActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalActionText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default BarberShopFeed; 