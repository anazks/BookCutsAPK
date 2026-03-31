import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { getShopBookings, confirmArrival, completeBooking } from '../../api/Service/Shop';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

// ─── Color palette (#1877F2 primary) ──────────────────────
const COLORS = {
  bg: '#F0F4F8',
  card: '#FFFFFF',
  cardBorder: '#E4EAF0',
  text: '#1A1A2E',
  textSecondary: '#5A6A7E',
  textMuted: '#8E99A8',
  primary: '#1877F2',
  primaryLight: '#3286F3',
  primaryBg: 'rgba(24,119,242,0.08)',
  primaryBorder: 'rgba(24,119,242,0.18)',
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  purple: '#8B5CF6',
  purpleBg: 'rgba(139,92,246,0.12)',
  divider: '#EEF2F6',
  white: '#FFFFFF',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  completed: { color: COLORS.success, bg: COLORS.successBg, icon: 'check-circle', label: 'Completed' },
  confirmed: { color: COLORS.primary, bg: COLORS.primaryBg, icon: 'verified', label: 'Confirmed' },
  pending: { color: COLORS.warning, bg: COLORS.warningBg, icon: 'schedule', label: 'Pending' },
  cancelled: { color: COLORS.danger, bg: COLORS.dangerBg, icon: 'cancel', label: 'Cancelled' },
  rescheduled: { color: COLORS.purple, bg: COLORS.purpleBg, icon: 'update', label: 'Rescheduled' },
};

// ─── Helper: format ISO time ──────────────────────────────
const formatTime = (isoString?: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ═══════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Bookings() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [enquiringId, setEnquiringId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    confirmed: 0,
    pending: 0,
  });

  // ── Map raw API booking → UI model ────────────────────
  const formatBooking = (b: any) => {
    // Customer name: from userId object
    const customer = b.userId?.firstName
      ? `${b.userId.firstName} ${b.userId.lastName || ''}`.trim()
      : 'Customer';

    // Staff/barber name
    const staff = b.barberId?.BarberName || 'Staff';

    // Detailed services array instead of just names
    const servicesList = b.services?.map((s: any) => ({
      name: s.name || 'Service',
      price: s.price || 0,
      duration: s.duration || 0,
    })) || [];
    
    // Fallback combined string for simple views
    const serviceNames = servicesList.map((s: any) => s.name).join(', ') || 'Service';

    // Time slot
    const timeStart = formatTime(b.timeSlot?.startingTime);
    const timeEnd = formatTime(b.timeSlot?.endingTime);
    const rawStartTime = b.timeSlot?.startingTime;

    return {
      id: b._id,
      userId: b.userId?._id,
      customer,
      customerPhone: b.userId?.mobileNo || b.userDetails?.mobileNo || 'N/A',
      service: serviceNames,
      servicesList,
      date: new Date(b.bookingDate),
      formattedDate: new Date(b.bookingDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      timeStart,
      timeEnd,
      rawStartTime,
      duration: `${b.totalDuration || 0} mins`,
      price: parseFloat(b.totalPrice) || 0,
      amountPaid: parseFloat(b.amountPaid) || 0,
      remainingAmount: parseFloat(b.remainingAmount) || 0,
      status: b.bookingStatus?.toLowerCase() || 'pending',
      staff,
      paymentStatus: b.paymentStatus?.toLowerCase() || 'pending',
      paymentType: b.paymentType || 'full',
      bookingTimestamp: new Date(b.bookingTimestamp || b.createdAt),
    };
  };


  // ── Fetch bookings ────────────────────────────────────
  const fetchBookings = useCallback(
    async (pageNum: number = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);
        setError(null);

        const response = await getShopBookings({ page: pageNum, limit: ITEMS_PER_PAGE });

        if (response?.success && response.data) {
          const formatted = response.data.map(formatBooking);

          if (pageNum === 1) {
            setBookings(formatted);
            if (response.stats) setSummary(response.stats);
          } else {
            setBookings(prev => {
              const merged = [...prev, ...formatted];
              // Remove duplicate bookings by ID
              const unique = Array.from(new Map(merged.map(b => [b.id, b])).values());
              return unique;
            });
            if (response.stats) setSummary(response.stats);
          }

          if (response.pagination) {
            setHasMore(pageNum < response.pagination.totalPages);
          } else {
            setHasMore(formatted.length >= ITEMS_PER_PAGE);
          }
          setPage(pageNum);
        } else if (response?.success && (!response.data || response.data.length === 0)) {
          if (pageNum === 1) {
            setBookings([]);
            setSummary({ total: 0, completed: 0, confirmed: 0, pending: 0 });
          }
          setHasMore(false);
        } else {
          let errorMsg = 'Failed to fetch bookings';
          if (response?.statusCode === 404) errorMsg = 'Please check your connection and try again.';
          else if (response?.statusCode === 500) errorMsg = 'Server error. Please try again later.';
          else if (response?.message) errorMsg = response.message;
          if (pageNum === 1) setError(errorMsg);
          if (!isRefresh && pageNum === 1) Alert.alert('Error', errorMsg);
        }
      } catch (err: any) {
        const errorMsg = err.message || 'An unexpected error occurred';
        if (pageNum === 1) setError(errorMsg);
        if (!isRefresh && pageNum === 1) Alert.alert('Error', errorMsg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => { fetchBookings(1); }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchBookings(1, true);
  }, [fetchBookings]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore && !loading) fetchBookings(page + 1);
  }, [loadingMore, hasMore, loading, page, fetchBookings]);

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setCompletingId(bookingId);
      const res = await completeBooking(bookingId);
      if (res?.success) {
        Alert.alert('Success', 'Booking marked as completed successfully.');
        fetchBookings(1, true); // Refresh list
      } else {
        Alert.alert('Error', res?.message || 'Failed to complete booking');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete booking');
    } finally {
      setCompletingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => activeFilter === 'all' || b.status === activeFilter);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBooking(expandedBooking === id ? null : id);
  };

  const handleCall = (phone: string) => {
    if (phone && phone !== 'N/A') Linking.openURL(`tel:${phone}`);
  };

  const handleEnquire = async (userId: string, bookingId: string) => {
    if (!userId) {
      Alert.alert('Error', 'Customer ID missing');
      return;
    }
    try {
      setEnquiringId(bookingId);
      const res = await confirmArrival(userId);
      if (res?.success) {
        Alert.alert('Success', 'Enquiry sent to the customer successfully.');
      } else {
        Alert.alert('Error', res?.message || 'Failed to send enquiry');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send enquiry');
    } finally {
      setEnquiringId(null);
    }
  };

  // ── Filter data ───────────────────────────────────────
  const filters = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
    { key: 'confirmed', label: 'Confirmed', icon: 'verified' },
    { key: 'pending', label: 'Pending', icon: 'schedule' },
    { key: 'cancelled', label: 'Cancelled', icon: 'cancel' },
  ];

  // ═══════════════════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════════════════

  // ── Summary bar ───────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statsBar}>
        <StatPill icon="event-note" label="Total" value={summary.total} color={COLORS.primary} />
        <StatPill icon="check-circle" label="Completed" value={summary.completed} color={COLORS.success} />
        <StatPill icon="verified" label="Confirmed" value={summary.confirmed} color={COLORS.primary} />
        <StatPill icon="hourglass-top" label="Pending" value={summary.pending} color={COLORS.warning} />
      </View>

      {/* Scrollable Filters (fixes VirtualizedList nesting error) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {filters.map(f => {
          const active = activeFilter === f.key;
          const count = f.key === 'all' ? bookings.length : bookings.filter(b => b.status === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              <MaterialIcons name={f.icon as any} size={15} color={active ? '#FFF' : COLORS.textMuted} />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label} <Text style={{opacity: 0.8}}>({count})</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <Text style={styles.sectionCount}>{filteredBookings.length}</Text>
      </View>
    </View>
  );

  const StatPill = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
    <View style={styles.statPill}>
      <View style={[styles.statPillIcon, { backgroundColor: color + '14' }]}>
        <MaterialIcons name={icon as any} size={16} color={color} />
      </View>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );

  // ── Booking Card ──────────────────────────────────────
  const renderBookingItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isExpanded = expandedBooking === item.id;

    // Check if Inform/Notify button should show (Success if confirmed and in the future)
    let showEnquire = false;
    if (item.status === 'confirmed' && item.rawStartTime) {
      const startTimeMs = new Date(item.rawStartTime).getTime();
      const nowMs = Date.now();
      if (startTimeMs > nowMs) {
        showEnquire = true;
      }
    }

    return (
      <TouchableOpacity 
        style={[styles.card, isExpanded && styles.cardExpanded]} 
        onPress={() => toggleExpand(item.id)} 
        activeOpacity={0.9}
      >
        <View style={styles.cardBody}>
          {/* Top Row: Date | Time | Status */}
          <View style={styles.cardTopRow}>
            <View style={styles.dateTimeBadge}>
              <MaterialIcons name="event" size={13} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>{item.formattedDate}</Text>
              <View style={styles.dotSeparator} />
              <MaterialIcons name="schedule" size={13} color={COLORS.primary} />
              <Text style={styles.timeText}>{item.timeStart}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <MaterialIcons name={cfg.icon as any} size={11} color={cfg.color} />
              <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{item.customer.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName} numberOfLines={1}>{item.customer}</Text>
              <View style={styles.barberBadge}>
                <MaterialIcons name="content-cut" size={11} color={COLORS.textMuted} />
                <Text style={styles.barberText}>with {item.staff}</Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceText}>₹{item.price.toLocaleString('en-IN')}</Text>
              {item.paymentStatus === 'paid' ? (
                <View style={styles.paymentPillPaid}>
                  <Text style={styles.paymentPillTextPaid}>PAID</Text>
                </View>
              ) : (
                <View style={styles.paymentPillUnpaid}>
                  <Text style={styles.paymentPillTextUnpaid}>UNPAID</Text>
                </View>
              )}
            </View>
          </View>

          {/* Collapsed view shows summary, Expanded shows details */}
          {!isExpanded ? (
            <View style={styles.collapsedSummary}>
              <Text style={styles.collapsedServiceText} numberOfLines={1}>
                {item.servicesList.length} service(s) • {item.duration}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.primaryLight} />
            </View>
          ) : (
            <View style={styles.expandedContent}>
              
              {/* Prominent Services Section */}
              <View style={styles.servicesContainer}>
                <Text style={styles.servicesTitle}>SERVICES BOOKED</Text>
                {item.servicesList.map((srv: any, idx: number) => (
                  <View key={idx} style={styles.serviceItem}>
                    <View style={styles.serviceItemLeft}>
                      <View style={styles.serviceBullet} />
                      <Text style={styles.serviceItemName}>{srv.name}</Text>
                    </View>
                    <View style={styles.serviceItemRight}>
                      <Text style={styles.serviceItemMins}>{srv.duration} min</Text>
                      <Text style={styles.serviceItemPrice}>₹{srv.price}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.serviceFooter}>
                  <Text style={styles.serviceTotalText}>Total Duration: {item.duration}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionGrid}>
                {item.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={styles.actionBtnComplete} 
                    onPress={() => handleCompleteBooking(item.id)}
                    disabled={completingId === item.id}
                    activeOpacity={0.8}
                  >
                    {completingId === item.id ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <MaterialIcons name="done-all" size={17} color={COLORS.white} />
                        <Text style={styles.actionBtnTextComplete}>Mark Completed</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {item.customerPhone !== 'N/A' && (
                  <TouchableOpacity style={styles.actionBtnCall} onPress={() => handleCall(item.customerPhone)} activeOpacity={0.8}>
                    <MaterialIcons name="call" size={17} color={COLORS.white} />
                    <Text style={styles.actionBtnTextCall}>Call</Text>
                  </TouchableOpacity>
                )}

                {showEnquire && item.status !== 'completed' && (
                  <TouchableOpacity 
                    style={styles.actionBtnEnquire} 
                    onPress={() => handleEnquire(item.userId, item.id)}
                    disabled={enquiringId === item.id}
                    activeOpacity={0.8}
                  >
                    {enquiringId === item.id ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <MaterialIcons name="waving-hand" size={17} color={COLORS.primary} />
                        <Text style={styles.actionBtnTextEnquire}>Notify</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.collapseHint}>
                <MaterialIcons name="keyboard-arrow-up" size={20} color={COLORS.primaryLight} />
              </View>

            </View>
          )}

        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 30 }} />;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════════════

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.bg} barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.bg} barStyle="dark-content" />
        <View style={styles.centered}>
          <View style={styles.errorCircle}>
            <MaterialIcons name="wifi-off" size={32} color={COLORS.danger} />
          </View>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBookings(1)} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.bg} barStyle="dark-content" />

      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <MaterialIcons name="event-available" size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? "Your schedule is clear. Bookings will appear here."
                : `No ${activeFilter} bookings at the moment.`}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      />
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { paddingBottom: 30 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

  // Error/Empty
  errorCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.dangerBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  errorMsg: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  retryBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 30, backgroundColor: COLORS.primary, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.divider },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  // Header Elements
  headerContainer: { paddingBottom: 10 },
  statsBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.cardBorder },
  statPill: { flex: 1, alignItems: 'center' },
  statPillIcon: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statPillValue: { fontSize: 15, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
  statPillLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },

  // Filters (ScrollView)
  filterList: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 13, fontWeight: '700', color: COLORS.primary, backgroundColor: COLORS.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },

  // ── Card Styles ──
  card: {
    marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardExpanded: {
    borderColor: COLORS.primaryBorder,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardBody: { padding: 16 },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider, marginBottom: 14 },
  dateTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted },
  timeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },

  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarLetter: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  barberBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barberText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  
  priceBlock: { alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  paymentPillPaid: { backgroundColor: COLORS.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  paymentPillTextPaid: { fontSize: 9, fontWeight: '800', color: COLORS.success, letterSpacing: 0.5 },
  paymentPillUnpaid: { backgroundColor: COLORS.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  paymentPillTextUnpaid: { fontSize: 9, fontWeight: '800', color: COLORS.warning, letterSpacing: 0.5 },

  // Collapsed View
  collapsedSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  collapsedServiceText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },

  // Expanded View
  expandedContent: { marginTop: 6 },
  servicesContainer: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, marginBottom: 16 },
  servicesTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 10 },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  serviceBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  serviceItemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  serviceItemRight: { alignItems: 'flex-end' },
  serviceItemMins: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 2 },
  serviceItemPrice: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  serviceFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', marginTop: 8, paddingTop: 10, alignItems: 'flex-end' },
  serviceTotalText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  actionGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtnComplete: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.success, paddingVertical: 12, borderRadius: 12 },
  actionBtnTextComplete: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  actionBtnCall: { flex: 0.8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12 },
  actionBtnTextCall: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  actionBtnEnquire: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, paddingVertical: 12, borderRadius: 12 },
  actionBtnTextEnquire: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },

  collapseHint: { alignItems: 'center', marginTop: 14, paddingBottom: 2 },

  footer: { paddingVertical: 20, alignItems: 'center' },
});