import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { myBookings } from '../../api/Service/Booking';

// Enable smooth layout animations on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function Bookings() {
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;
  const isMounted = useRef(true);
  const hasFetchedInitial = useRef(false);

  const fetchBookings = useCallback(
    async (isRefresh: boolean = false) => {
      if (!isMounted.current) return;

      // Prevent overlapping calls
      if (!isRefresh && loadingMore) return;

      if (isRefresh) {
        setRefreshing(true);
        setBookings([]);
        setNextCursor(null);
        setHasMore(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const params: { limit: number; lastDate?: string } = { limit: LIMIT };
        if (!isRefresh && nextCursor) {
          params.lastDate = nextCursor;
        }

        const response = await myBookings(params);

        if (!isMounted.current) return;

        if (response?.success && Array.isArray(response.bookings)) {
          const newBookings = response.bookings;

          setBookings((prev) => (isRefresh ? newBookings : [...prev, ...newBookings]));

          const receivedCursor = response.nextCursor;
          setNextCursor(receivedCursor || null);

          // No more pages if we got fewer items than requested or no cursor
          if (newBookings.length < LIMIT || !receivedCursor) {
            setHasMore(false);
          }
        } else {
          setError('No bookings available at this time.');
        }
      } catch (err: any) {
        console.error('Bookings fetch error:', err);
        if (isMounted.current) {
          setError('Failed to load bookings. Please check your connection.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [nextCursor, loadingMore] // reduced dependencies → more stable
  );

  // Initial load – only once
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;

    fetchBookings(true);

    return () => {
      isMounted.current = false;
    };
  }, []); // ← empty array = mount only

  const onRefresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  const loadMore = useCallback(() => {
    // Extra safety: don't trigger if already doing something
    if (loading || loadingMore || refreshing || !hasMore) return;
    fetchBookings(false);
  }, [loading, loadingMore, refreshing, hasMore, fetchBookings]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Invalid Date';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return { bg: '#EEF2FF', text: '#4F46E5', border: '#4F46E5' };
      case 'completed': return { bg: '#F0FDF4', text: '#059669', border: '#059669' };
      case 'pending':   return { bg: '#FFFBEB', text: '#D97706', border: '#D97706' };
      case 'cancelled': return { bg: '#FEF2F2', text: '#DC2626', border: '#DC2626' };
      default:          return { bg: '#F9FAFB', text: '#6B7280', border: '#6B7280' };
    }
  };

  const getPaymentStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':    return { bg: '#F0FDF4', text: '#059669', border: '#059669' };
      case 'partial': return { bg: '#FFFBEB', text: '#D97706', border: '#D97706' };
      case 'pending': return { bg: '#FEF2F2', text: '#DC2626', border: '#DC2626' };
      default:        return { bg: '#F9FAFB', text: '#6B7280', border: '#6B7280' };
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 15, fontWeight: '500' }}>
            Loading your bookings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              backgroundColor: '#F9FAFB',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 32 }}>⚠️</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchBookings(true)}
            style={{
              backgroundColor: '#4F46E5',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: Platform.OS === 'ios' ? 0 : 40,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Home')}
          style={{
            backgroundColor: '#4F46E5',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>← Home</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '400' }}>
          {bookings.length} {bookings.length === 1 ? 'appointment' : 'appointments'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4} // trigger earlier
        scrollEventThrottle={400}
      >
        {bookings.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 48 }}>📅</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              No Bookings Yet
            </Text>
            <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 }}>
              Time to book your next haircut!
            </Text>
          </View>
        ) : (
          bookings.map((booking) => {
            const isExpanded = expandedId === booking._id;
            const statusStyle = getStatusStyle(booking.bookingStatus);

            const startTime = booking.timeSlot?.startingTime
              ? formatTime(booking.timeSlot.startingTime)
              : 'N/A';
            const endTime = booking.timeSlot?.endingTime
              ? formatTime(booking.timeSlot.endingTime)
              : 'N/A';

            return (
              <TouchableOpacity
                key={booking._id}
                activeOpacity={0.95}
                onPress={() => toggleExpand(booking._id)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: isExpanded ? '#4F46E5' : '#E5E7EB',
                  overflow: 'hidden',
                }}
              >
                {/* Card Header */}
                <View
                  style={{
                    backgroundColor: isExpanded ? '#F9FAFB' : '#FFFFFF',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
                        {booking.shopId?.ShopName || 'Salon Shop'}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '400' }}>
                        {formatDate(booking.bookingDate)}
                      </Text>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 4,
                        backgroundColor: statusStyle.bg,
                        borderWidth: 1,
                        borderColor: statusStyle.border,
                      }}
                    >
                      <Text
                        style={{
                          color: statusStyle.text,
                          fontSize: 11,
                          fontWeight: '700',
                          letterSpacing: 0.3,
                        }}
                      >
                        {booking.bookingStatus?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Main Content */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#9CA3AF',
                          fontWeight: '600',
                          letterSpacing: 0.5,
                          marginBottom: 6,
                          textTransform: 'uppercase',
                        }}
                      >
                        Time Slot
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                        {startTime}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '400', color: '#6B7280', marginTop: 2 }}>
                        to {endTime}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: '#EEF2FF',
                        borderRadius: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: '#4F46E5',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#4F46E5',
                          fontWeight: '600',
                          letterSpacing: 0.3,
                          marginBottom: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        Total
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '700',
                          color: '#4F46E5',
                          letterSpacing: -0.5,
                        }}
                      >
                        ₹{booking.totalPrice || 0}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', marginRight: 8 }}>
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </Text>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 3,
                        backgroundColor: '#4F46E5',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
                        {isExpanded ? '−' : '+'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Expanded Section */}
                {isExpanded && (
                  <View
                    style={{
                      padding: 16,
                      paddingTop: 0,
                      backgroundColor: '#FAFAFA',
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                    }}
                  >
                    {/* Services */}
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
                        Services Booked
                      </Text>

                      {(booking.services || []).length > 0 ? (
                        booking.services.map((service: any, index: number) => (
                          <View
                            key={service._id || service.id || index}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              paddingVertical: 12,
                              borderBottomWidth: index < booking.services.length - 1 ? 1 : 0,
                              borderBottomColor: '#F3F4F6',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                                {service.name}
                              </Text>
                              <Text style={{ fontSize: 13, color: '#6B7280' }}>
                                {service.duration} minutes
                              </Text>
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                              ₹{service.price}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 14, paddingVertical: 8 }}>
                          No services listed
                        </Text>
                      )}
                    </View>

                    {/* Booking Details */}
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
                        Booking Details
                      </Text>

                      <DetailRow label="Barber" value={booking.barberId?.BarberName || 'N/A'} />
                      <DetailRow label="Time Slot" value={`${startTime} – ${endTime}`} />
                      <DetailRow label="Total Duration" value={`${booking.totalDuration || 0} min`} />
                      <DetailRow
                        label="Booked On"
                        value={
                          booking.bookingTimestamp
                            ? new Date(booking.bookingTimestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'
                        }
                      />
                    </View>

                    {/* Payment Summary */}
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 6,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
                        Payment Summary
                      </Text>

                      <DetailRow label="Amount Paid" value={`₹${booking.amountPaid || 0}`} isBold color="#059669" />
                      {booking.remainingAmount > 0 && (
                        <DetailRow label="Remaining" value={`₹${booking.remainingAmount}`} isBold color="#DC2626" />
                      )}

                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: '#F3F4F6',
                        }}
                      >
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Payment Status</Text>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 4,
                            backgroundColor: getPaymentStyle(booking.paymentStatus).bg,
                            borderWidth: 1,
                            borderColor: getPaymentStyle(booking.paymentStatus).border,
                          }}
                        >
                          <Text
                            style={{
                              color: getPaymentStyle(booking.paymentStatus).text,
                              fontSize: 11,
                              fontWeight: '700',
                              letterSpacing: 0.3,
                            }}
                          >
                            {booking.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ marginTop: 12, paddingVertical: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>
                        Booking ID: {booking._id?.slice(-12).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {loadingMore && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
              Loading more bookings...
            </Text>
          </View>
        )}

        {!hasMore && bookings.length > 0 && !loadingMore && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>• End of bookings •</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  isBold = false,
  color,
}: {
  label: string;
  value: string;
  isBold?: boolean;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '400' }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: isBold ? '700' : '600',
          color: color || '#111827',
        }}
      >
        {value}
      </Text>
    </View>
  );
}