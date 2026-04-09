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
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getShopById, getShopOffers, Offer } from '../../api/Service/Shop';

const { width: screenWidth } = Dimensions.get('window');

const BarberShopFeed = () => {
  const { shop_id } = useLocalSearchParams();
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offerScrollRef = useRef<any>(null);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  const [shopOffers, setShopOffers] = useState<Offer[]>([]);


  const fetchShopData = async () => {
    if (!shop_id) {
      setError('Shop ID not provided');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [shopRes, offersRes] = await Promise.all([
        getShopById(shop_id as string),
        getShopOffers(shop_id as string)
      ]);

      if (shopRes && shopRes.success && shopRes.data && shopRes.data.length > 0) {
        setShopData(shopRes.data[0]);
        setError(null);
      } else {
        setError('Failed to fetch shop data');
      }

      if (offersRes && offersRes.success && offersRes.data) {
        setShopOffers(offersRes.data);
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
    if (shopOffers.length <= 1) return;
    
    const interval = setInterval(() => {
      if (offerScrollRef.current) {
        const nextIndex = (currentOfferIndex + 1) % shopOffers.length;
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
    }, 4000);
    return () => clearInterval(interval);
  }, [currentOfferIndex, shopOffers.length]);

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
          message: `Check out this from ${shopData?.ShopName || 'Barber Shop'}: ${selectedMedia?.caption || ''}`,
          url: selectedMedia.uri,
        };
        await Share.share(shareOptions);
      } catch (error) {
        // Fallback to WhatsApp if Share fails
        const message = `Check out this from ${shopData?.ShopName || 'Barber Shop'}: ${selectedMedia?.caption || ''}`;
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}&attach=${selectedMedia.uri}`;
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
            <Text style={styles.feedShopName}>{shopData?.ShopName || 'Barber Shop'}</Text>
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

  const renderOfferCard = ({ item, index }: { item: Offer; index: number }) => {
    const validDate = new Date(item.validUntil).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <View style={[styles.offerCard, { backgroundColor: getGradient(index)[0] }]}>
        <LinearGradient
          colors={getGradient(index)}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.offerContent}>
          <Text style={styles.offerTitle}>{item.title}</Text>
          <Text style={styles.offerDescription} numberOfLines={2}>
            {item.description}
          </Text>
          {!!item.discountValue && (
            <View style={styles.offerCodeContainer}>
              <Text style={styles.offerCode}>
                {item.discountType === 'percentage' ? `${item.discountValue}%` : `₹${item.discountValue}`} OFF
              </Text>
            </View>
          )}
          <Text style={styles.offerValidity}>Valid until {validDate}</Text>
        </View>
        <View style={styles.offerIcon}>
          <Ionicons name="gift" size={24} color="#FFF" />
        </View>
      </View>
    );
  };

  // Render header section (Modern Hero Image layout)
  const renderHeader = () => {
    const audience = shopData?.targetAudience || [];
    const lowerAudience = audience.map((a: string) => a.toLowerCase());
    
    let audienceLabel = '';
    let audienceIcon = 'people';
    let badgeColor = '#FFF';

    if (lowerAudience.includes('men') && lowerAudience.includes('women')) {
      audienceLabel = 'Unisex';
      audienceIcon = 'male-female';
    } else if (lowerAudience.length > 0) {
      audienceLabel = audience.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1)).join(' • ');
      if (lowerAudience.includes('men')) audienceIcon = 'man';
      else if (lowerAudience.includes('women')) audienceIcon = 'woman';
      else if (lowerAudience.includes('kids')) audienceIcon = 'happy';
    }

    return (
      <View style={styles.headerHeroSection}>
        {shopData?.ProfileImage ? (
          <Image source={{ uri: shopData.ProfileImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1877F2' }]} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFillObject} />

        <TouchableOpacity style={styles.heroBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.heroContentContainer}>
          <Text style={styles.shopNameHero}>{shopData?.ShopName || 'Shop Name'}</Text>
          <View style={styles.shopDetailsRowHero}>
            <Text style={styles.locationTextHero} numberOfLines={2}>
              <Ionicons name="location" size={14} color="#FFF" /> {shopData?.ExactLocation}, {shopData?.City || 'Unknown City'}
            </Text>
            {shopData?.Timing && (
              <Text style={styles.timingTextHero}>
                <Ionicons name="time" size={14} color="#FFF" /> {shopData.Timing}
              </Text>
            )}
            {audienceLabel !== '' && (
              <View style={styles.audienceBadgeHero}>
                <Ionicons name={audienceIcon as any} size={12} color="#FFF" />
                <Text style={styles.audienceTextHero}>{audienceLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render Top Trends Section (Static mock for now since media api is unstructured)
  const shopTrends = [
    { id: 't1', name: 'Buzz Cut', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&q=80' },
    { id: 't2', name: 'Classic Taper', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&q=80' },
    { id: 't3', name: 'Skin Fade', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&q=80' },
  ];

  const renderTrends = () => (
    <View style={styles.trendsContainer}>
      <Text style={styles.offersBannerTitle}>Top Trends</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={shopTrends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingLeft: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.trendCard} activeOpacity={0.8}>
            <Image source={{ uri: item.image }} style={styles.trendImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.trendGradient}>
              <Text style={styles.trendName} numberOfLines={1}>{item.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderOffers = () => {
    if (shopOffers.length === 0) return null;

    return (
      <View style={styles.offersBannerContainer}>
        <Text style={styles.offersBannerTitle}>Special Offers</Text>
        <FlatList
          ref={offerScrollRef}
          data={shopOffers}
          renderItem={renderOfferCard}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersContainer}
          snapToInterval={screenWidth * 0.8 + 12}
          decelerationRate="fast"
        />
      </View>
    );
  };

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
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#1877F2" />
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
    { type: 'trends', id: 'trends' },
    ...((shopData.media || []).map(item => ({ ...item, type: 'media' })))
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return renderHeader();
      case 'offers':
        return renderOffers();
      case 'trends':
        return renderTrends();
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
                <Ionicons name="share-social-outline" size={20} color="#1877F2" />
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
    backgroundColor: '#1877F2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Hero Header Styles
  headerHeroSection: {
    width: '100%',
    height: 280,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    zIndex: 2,
  },
  shopNameHero: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  shopMetaRowHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopDetailsRowHero: {
    flexDirection: 'column',
    gap: 6,
  },
  locationTextHero: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  timingTextHero: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '600',
  },
  audienceBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  audienceTextHero: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  // Sub Section Styles (Trends)
  trendsContainer: {
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  trendCard: {
    width: 140,
    height: 180,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  trendImage: {
    width: '100%',
    height: '100%',
  },
  trendGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 12,
  },
  trendName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Offers Banner Styles
  offersBannerContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  offersBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  offersContainer: {
    paddingLeft: 20,
  },
  offerCard: {
    width: screenWidth * 0.8,
    marginRight: 12,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
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
    paddingBottom: 80,
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
    backgroundColor: '#1877F2',
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
    backgroundColor: '#1877F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#1877F2',
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
    color: '#1877F2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default BarberShopFeed; 