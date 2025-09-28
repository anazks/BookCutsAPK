import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams,router } from 'expo-router';
import { getShopById } from '../../api/Service/Shop';

const { width: screenWidth } = Dimensions.get('window');
// const itemWidth = (screenWidth - 6) / 3; // 🗑️ DELETED: Not needed for single-column feed

const BarberShopFeed = () => {
  const { shop_id } = useLocalSearchParams();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const offerScrollRef = useRef(null);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  // Static offers data - can be replaced with API data later (Unchanged)
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

  // Static media data (Unchanged)
  const mediaData = [
    {
      id: '1',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Classic Fade Cut'
    },
    {
      id: '2',
      type: 'video',
      uri: 'https://images.unsplash.com/photo-1622286346003-c3b4c1da6d66?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Beard Trimming Process'
    },
    {
      id: '3',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Modern Pompadour'
    },
    {
      id: '4',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1619113045935-d5c71e3470b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Hair Styling'
    },
    {
      id: '5',
      type: 'video',
      uri: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Hot Towel Treatment'
    },
    {
      id: '6',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Classic Undercut'
    },
    // Duplicate data to show more feed items
    {
      id: '7',
      type: 'video',
      uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Hair Wash Service'
    },
    {
      id: '8',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Mustache Trimming'
    },
    {
      id: '9',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Modern Cut'
    },
    {
      id: '10',
      type: 'video',
      uri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Fade Technique'
    },
    {
      id: '11',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1622286346003-c3b4c1da6d66?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Precision Cut'
    },
    {
      id: '12',
      type: 'image',
      uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      caption: 'Style Finish'
    }
  ];

  // Fetch shop data from API (Unchanged)
  const fetchShopData = async () => {
    if (!shop_id) {
      setError('Shop ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getShopById(shop_id);
      console.log('Shop API response:', response);

      if (response && response.success && response.data && response.data.length > 0) {
        setShopData(response.data[0]);  // take the first shop
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

  // Auto-scroll offers banner (Unchanged)
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
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [currentOfferIndex, offers.length]);

  // Fetch shop data on component mount (Unchanged)
  useEffect(() => {
    fetchShopData();
  }, [shop_id]);

  const handleMediaPress = (media) => {
    setSelectedMedia(media);
    setModalVisible(true);
  };

  const handleBookNow = () => {
    console.log('Book Now pressed for:', shopData?.ShopName || 'Unknown Shop');
        router.push({
          pathname: '/Screens/User/BookNow',
          params: { shop_id: shop_id }
  })
}


  const handleCallPress = () => {
    if (shopData?.Mobile) {
      const phoneNumber = shopData.Mobile.replace(/\D/g, ''); // Remove all non-digit characters
      Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Failed to open phone app:', err));
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
  };

  // 🗑️ DELETED: renderMediaItem for the grid is removed

  // ✨ NEW: renderFeedItem for the vertical feed
  const renderFeedItem = (item) => (
    <View style={styles.feedItemContainer} key={item.id}>
      
      {/* Feed Item Header (Profile-like) */}
      <View style={styles.feedHeader}>
        <View style={styles.feedAvatar} />
        <View style={styles.feedUserInfo}>
          <Text style={styles.feedShopName}>{shopData.ShopName || 'Barber Shop'}</Text>
          <Text style={styles.feedCaptionPreview} numberOfLines={1}>{item.caption}</Text>
        </View>
        <TouchableOpacity style={styles.feedMoreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Media Content (Image/Video) */}
      <TouchableOpacity
        style={styles.feedMedia}
        onPress={() => handleMediaPress(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.feedImage}
          resizeMode="cover" // Cover is better for full-width feed
        />
        {/* Video Play Icon Overlay */}
        {item.type === 'video' && (
          <View style={styles.videoFeedOverlay}>
            <Ionicons name="play" size={32} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Feed Actions */}
      {/* <View style={styles.feedActions}>
        <View style={styles.feedActionRow}>
          <TouchableOpacity style={styles.feedActionButton}>
            <Ionicons name="heart-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton}>
            <Ionicons name="send-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.feedActionButton}>
          <Ionicons name="bookmark-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View> */}
      
      {/* Caption/Description */}
      {/* <View style={styles.feedCaptionContainer}>
        <Text style={styles.feedCaptionText}>
          <Text style={styles.feedCaptionUser}>{shopData.ShopName || 'Barber Shop'}</Text>
          {' '}
          {item.caption}
        </Text>
        <TouchableOpacity>
          <Text style={styles.feedViewComments}>View all comments</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header - Remains in ScrollView to allow full scrolling */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shopData.ShopName || 'Shop Name'}</Text>
              
              <View style={styles.shopMetaRow}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>4.5</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.openDot} />
                  <Text style={styles.openText}>Open</Text>
                </View>
                <Text style={styles.locationText} numberOfLines={1}>
                  <Ionicons name="location-outline" size={14} color="#888" />  {shopData.ExactLocation}  {shopData.City  || 'Unknown City'}
                </Text>
              </View>

              <View style={styles.shopMetaRow}>
                {shopData.Timing && (
                  <Text style={styles.timingText}>
                    <Ionicons name="time-outline" size={14} color="#888" /> {shopData.Timing}
                  </Text>
                )}
                {shopData.Mobile && (
                  <TouchableOpacity onPress={handleCallPress} style={styles.mobileContainer}>
                    <Ionicons name="call-outline" size={14} color="#FF6B6B" />
                    <Text style={styles.mobileText}>Call: {shopData.Mobile}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Offers Banner */}
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

        {/* Media Feed - New Vertical Layout */}
        <View style={styles.feedListContainer}>
          {mediaData.map(renderFeedItem)}
        </View>

        {/* Bottom spacing for floating button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Book Now Button (Unchanged) */}
      <TouchableOpacity
        style={styles.floatingBookButton}
        onPress={handleBookNow}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>Book Now</Text>
        <Ionicons name="calendar" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Media Modal - remains the same (Unchanged) */}
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
            {/* Modal Header */}
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

            {/* Media Display */}
            <View style={styles.modalMediaContainer}>
              {selectedMedia && (
                <>
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />

                  {/* Video Play Button */}
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

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalActionButton}>
                <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
                <Text style={styles.modalActionText}>Like</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalActionButton}>
                <Ionicons name="share-social-outline" size={20} color="#FF6B6B" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalActionButton}>
                <Ionicons name="bookmark-outline" size={20} color="#FF6B6B" />
                <Text style={styles.modalActionText}>Save</Text>
              </TouchableOpacity>
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

  // Loading and Error States (Unchanged)
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

  // Header Styles (Moved into ScrollView, padding top adjusted slightly)
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50, // To clear the status bar
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    // Removed shadow/elevation to let the feed items scroll up to the top naturally
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
  },
  ratingText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationText: {
    color: '#666',
    fontSize: 14,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginRight: 15,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: '#4CAF50',
  },
  openText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  timingText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 15,
  },
  mobileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  mobileText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Offers Banner Styles (Unchanged)
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

  // Scroll Container Styles (Adjusted for feed layout)
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Ensure space for the floating button
  },
  
  // NEW: Feed Item Styles (Instagram-like)
  feedListContainer: {
    backgroundColor: '#FFF',
  },
  feedItemContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  feedAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    marginRight: 10,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedShopName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1A1A1A',
  },
  feedCaptionPreview: {
    fontSize: 12,
    color: '#888',
  },
  feedMoreButton: {
    padding: 5,
  },
  feedMedia: {
    width: '100%',
    aspectRatio: 1, // Common for Instagram media
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  videoFeedOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  feedActionRow: {
    flexDirection: 'row',
  },
  feedActionButton: {
    padding: 8,
    marginRight: 4,
  },
  feedCaptionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  feedCaptionText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  feedCaptionUser: {
    fontWeight: '700',
  },
  feedViewComments: {
    fontSize: 14,
    color: '#888',
  },
  
  // Grid styles are now unused/removed from the implementation but kept below for comparison if needed
  // gridContainer: { flex: 1, backgroundColor: '#FFF', paddingTop: 2, },
  // gridRow: { justifyContent: 'space-between', marginBottom: 2, },
  // mediaGridItem: { backgroundColor: '#F0F0F0', position: 'relative', marginBottom: 2, },
  // gridImage: { width: '100%', height: '100%', },
  // videoGridOverlay: { /* ... */ },
  // mediaTypeBadge: { /* ... */ },

  // Floating Button (Unchanged)
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

  // Modal Styles (Unchanged)
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
    justifyContent: 'space-around',
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

  // Spacing (Unchanged)
  bottomSpacing: {
    height: 20,
  },
});

export default BarberShopFeed;