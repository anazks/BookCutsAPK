import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getShopById } from '../../api/Service/Shop';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Offer data ────────────────────────────────────────────
const OFFERS = [
  { id: '1', title: '20% OFF First Visit',   description: 'New customers get 20% off on all services', code: 'FIRST20',    validUntil: '2025-10-31' },
  { id: '2', title: 'Free Beard Trim',        description: 'Get free beard trim with any haircut service', code: 'BEARDTRIM', validUntil: '2025-09-30' },
  { id: '3', title: 'Weekend Special',        description: '15% off on weekend bookings',                  code: 'WEEKEND15', validUntil: '2025-12-31' },
  { id: '4', title: 'Student Discount',       description: '25% off for students with valid ID',           code: 'STUDENT25', validUntil: '2025-12-31' },
];

// ═════════════════════════════════════════════════════════
const BarberShopFeed = () => {
  const { shop_id } = useLocalSearchParams();
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [modalVisible, setModalVisible]   = useState(false);
  const [shopData, setShopData]           = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const offerScrollRef  = useRef<FlatList>(null);
  const [offerIndex, setOfferIndex] = useState(0);

  // Modal animation
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale   = useRef(new Animated.Value(0.92)).current;
  // Book button pulse
  const bookPulse    = useRef(new Animated.Value(1)).current;

  // ── Fetch ───────────────────────────────────────────────
  const fetchShopData = async () => {
    if (!shop_id) { setError('Shop ID not provided'); setLoading(false); return; }
    try {
      setLoading(true);
      const res = await getShopById(shop_id);
      if (res?.success && res?.data?.length > 0) {
        setShopData(res.data[0]); setError(null);
      } else { setError('Failed to fetch shop data'); }
    } catch { setError('Failed to load shop information'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchShopData(); }, [shop_id]);

  // ── Auto-scroll offers ──────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (offerScrollRef.current && OFFERS.length > 0) {
        const next = (offerIndex + 1) % OFFERS.length;
        try { offerScrollRef.current.scrollToIndex({ index: next, animated: true }); setOfferIndex(next); }
        catch {}
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [offerIndex]);

  // ── Book button pulse ───────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bookPulse, { toValue: 1.03, duration: 900,  useNativeDriver: true }),
        Animated.timing(bookPulse, { toValue: 1,    duration: 900,  useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Modal open/close ────────────────────────────────────
  const openModal = (media: any) => {
    setSelectedMedia(media);
    setModalVisible(true);
    modalOpacity.setValue(0);
    modalScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(modalScale,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(modalScale,   { toValue: 0.92, duration: 180, useNativeDriver: true }),
    ]).start(() => { setModalVisible(false); setSelectedMedia(null); });
  };

  const handleBookNow = () => {
    router.push({ pathname: '/Screens/User/BookNow', params: { shop_id } });
  };

  // ── Render helpers ──────────────────────────────────────
  const renderHeader = () => (
    <View>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <View style={styles.backBtnInner}>
          <Ionicons name="arrow-back" size={20} color="#D4AF37" />
        </View>
      </TouchableOpacity>

      {/* Hero gradient header */}
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D']}
        style={styles.heroHeader}
      >
        {/* Gold accent top bar */}
        <View style={styles.goldAccentBar} />

        <View style={styles.headerRow}>
          {/* Profile image */}
          <View style={styles.avatarRing}>
            {shopData?.ProfileImage ? (
              <Image source={{ uri: shopData.ProfileImage }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <LinearGradient colors={['#D4AF37', '#A0832A']} style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{shopData?.ShopName?.charAt(0) || 'S'}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Shop info */}
          <View style={{ flex: 1 }}>
            <Text style={styles.heroShopName} numberOfLines={1}>{shopData?.ShopName || 'Shop Name'}</Text>

            <View style={styles.metaRow}>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={11} color="#D4AF37" />
                <Text style={styles.ratingText}>4.5</Text>
              </View>
              <View style={styles.openPill}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open</Text>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <View style={styles.infoLine}>
                <Ionicons name="location-outline" size={12} color="rgba(212,175,55,0.7)" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {shopData?.ExactLocation}, {shopData?.City || 'Unknown City'}
                </Text>
              </View>
              {shopData?.Timing && (
                <View style={styles.infoLine}>
                  <Ionicons name="time-outline" size={12} color="rgba(212,175,55,0.7)" />
                  <Text style={styles.infoText}>{shopData.Timing}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderOffers = () => (
    <View style={styles.offersSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Special Offers</Text>
        <Text style={styles.sectionSub}>EXCLUSIVE DEALS</Text>
      </View>

      <FlatList
        ref={offerScrollRef}
        data={OFFERS}
        renderItem={({ item }) => (
          <View style={styles.offerCard}>
            {/* Gold gradient border */}
            <LinearGradient
              colors={['rgba(212,175,55,0.6)', 'rgba(212,175,55,0.15)', 'rgba(212,175,55,0.5)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.offerBorder}
            >
              <LinearGradient
                colors={['#1E1C14', '#171510']}
                style={styles.offerInner}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerTitle}>{item.title}</Text>
                  <Text style={styles.offerDesc}>{item.description}</Text>
                  <View style={styles.offerCodeBadge}>
                    <Text style={styles.offerCodeText}>CODE: {item.code}</Text>
                  </View>
                  <Text style={styles.offerValidity}>Valid until {item.validUntil}</Text>
                </View>
                <View style={styles.offerIconWrap}>
                  <Ionicons name="gift" size={22} color="#D4AF37" />
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
        snapToInterval={SCREEN_WIDTH * 0.82 + 12}
        decelerationRate="fast"
      />
    </View>
  );

  const renderFeedItem = (item: any) => {
    let imageUrl = item.url;
    if (!imageUrl && typeof item === 'object' && !Array.isArray(item)) {
      imageUrl = Object.keys(item)
        .filter(k => !isNaN(parseInt(k)) && k !== '_id')
        .map(k => item[k]).join('');
    }
    const caption = item.title || item.description || '';

    return (
      <View style={styles.feedCard} key={item._id || item.id}>
        {/* Feed post header */}
        <View style={styles.feedCardHeader}>
          <LinearGradient colors={['#D4AF37', '#A0832A']} style={styles.feedAvatar}>
            <Text style={styles.feedAvatarLetter}>{shopData?.ShopName?.charAt(0) || 'S'}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.feedShopName}>{shopData?.ShopName || 'Barber Shop'}</Text>
            <Text style={styles.feedMeta}>FEATURED WORK</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#D4AF37" />
          </View>
        </View>

        {/* Image */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => openModal({ uri: imageUrl, caption, type: 'image' })}
        >
          <Image source={{ uri: imageUrl }} style={styles.feedImage} resizeMode="cover" />
          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.feedImageOverlay}
          />
        </TouchableOpacity>

        {/* Caption */}
        {!!caption && (
          <View style={styles.feedCaption}>
            <Text style={styles.feedCaptionText} numberOfLines={2}>{caption}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.feedDivider} />
      </View>
    );
  };

  const renderEmptyFeed = () => (
    <View style={styles.emptyState}>
      <Ionicons name="image-outline" size={52} color="rgba(212,175,55,0.3)" />
      <Text style={styles.emptyTitle}>No Media Yet</Text>
      <Text style={styles.emptyText}>This shop hasn't posted any work yet</Text>
    </View>
  );

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  // ── Error ───────────────────────────────────────────────
  if (error || !shopData) {
    return (
      <View style={styles.errorScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Ionicons name="alert-circle-outline" size={52} color="rgba(212,175,55,0.5)" />
        <Text style={styles.errorTitle}>{error || 'Shop not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchShopData}>
          <LinearGradient colors={['#D4AF37', '#B8941E']} style={styles.retryGradient}>
            <Text style={styles.retryText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main list ───────────────────────────────────────────
  const listData = [
    { type: 'header', id: 'header' },
    { type: 'offers', id: 'offers' },
    ...((shopData.media || []).map((item: any) => ({ ...item, type: 'media' }))),
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <FlatList
        data={listData}
        keyExtractor={(item, i) => item._id || item.id || i.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListEmptyComponent={renderEmptyFeed}
        renderItem={({ item }) => {
          if (item.type === 'header') return renderHeader();
          if (item.type === 'offers') return renderOffers();
          if (item.type === 'media')  return renderFeedItem(item);
          return null;
        }}
      />

      {/* Floating Book Now Button */}
      <Animated.View style={[styles.floatingBtnWrap, { transform: [{ scale: bookPulse }] }]}>
        <TouchableOpacity activeOpacity={0.88} onPress={handleBookNow}>
          <LinearGradient colors={['#D4AF37', '#B8941E']} style={styles.floatingBtn}>
            <Text style={styles.floatingBtnText}>Book Now</Text>
            <Ionicons name="calendar" size={18} color="#0A0A0A" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Media Preview Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />

          <Animated.View style={[styles.modalBox, { transform: [{ scale: modalScale }] }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedMedia?.caption || 'Preview'}
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Image */}
            {selectedMedia && (
              <View style={styles.modalImageWrap}>
                <Image source={{ uri: selectedMedia.uri }} style={styles.modalImage} resizeMode="contain" />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A0A0A' },

  // Loading / Error
  loadingScreen: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  loadingText:   { marginTop: 14, color: '#D4AF37', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  errorScreen:   { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  errorTitle:    { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryBtn:      { borderRadius: 25, overflow: 'hidden' },
  retryGradient: { paddingHorizontal: 28, paddingVertical: 13 },
  retryText:     { color: '#0A0A0A', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Back button (floats over header)
  backBtn: { position: 'absolute', top: 52, left: 18, zIndex: 10 },
  backBtnInner: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(10,10,10,0.7)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero header
  heroHeader:   { paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20 },
  goldAccentBar: { height: 2, backgroundColor: '#D4AF37', marginBottom: 24, width: 40, borderRadius: 1 },
  headerRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },

  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 2, borderColor: '#D4AF37',
    padding: 2, overflow: 'hidden',
  },
  avatar:        { width: '100%', height: '100%', borderRadius: 36 },
  avatarFallback: { width: '100%', height: '100%', borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:  { fontSize: 28, fontWeight: '800', color: '#0A0A0A' },

  heroShopName:  { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: 0.2 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  ratingText: { color: '#D4AF37', fontSize: 12, fontWeight: '700' },
  openPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(52,211,153,0.12)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
  },
  openDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  openText: { color: '#34D399', fontSize: 11, fontWeight: '600' },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, flex: 1 },

  // Offers
  offersSection: { backgroundColor: '#0A0A0A', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.1)' },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  sectionSub:    { fontSize: 10, color: 'rgba(212,175,55,0.7)', marginTop: 2, letterSpacing: 1.5, fontWeight: '700' },

  offerCard:   { width: SCREEN_WIDTH * 0.82, marginRight: 12 },
  offerBorder: { borderRadius: 16, padding: 1.5 },
  offerInner: {
    borderRadius: 15, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  offerTitle:     { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  offerDesc:      { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 10 },
  offerCodeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginBottom: 6,
  },
  offerCodeText:  { fontSize: 11, fontWeight: '700', color: '#D4AF37', letterSpacing: 0.5 },
  offerValidity:  { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  offerIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Feed cards
  feedCard: { backgroundColor: '#0A0A0A', marginBottom: 2 },
  feedCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  feedAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  feedAvatarLetter: { fontSize: 14, fontWeight: '800', color: '#0A0A0A' },
  feedShopName:     { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 1 },
  feedMeta:         { fontSize: 9, fontWeight: '700', color: 'rgba(212,175,55,0.6)', letterSpacing: 1.2 },
  verifiedBadge:    {},

  feedImage: { width: '100%', height: 380 },
  feedImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },

  feedCaption: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  feedCaptionText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
  feedDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.08)', marginTop: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginTop: 16, marginBottom: 6 },
  emptyText:  { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  // Floating book button
  floatingBtnWrap: {
    position: 'absolute', bottom: 28, left: 20, right: 20,
    borderRadius: 50, overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16,
    elevation: 12,
  },
  floatingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  floatingBtnText: { color: '#0A0A0A', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#141414',
    borderRadius: 20, marginHorizontal: 16,
    width: SCREEN_WIDTH - 32,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.15)',
  },
  modalTitle:    { flex: 1, fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginRight: 12 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalImageWrap: { backgroundColor: '#000', aspectRatio: 1 },
  modalImage:     { width: '100%', height: '100%' },
});

export default BarberShopFeed;