import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { myBookings } from '../../api/Service/Booking';

// Enable smooth animations on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ITEMS_PER_PAGE = 10;

export default function Bookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetchBookings(true);
  }, []);

  const fetchBookings = async (initialLoad = false, cursor: string | null = null) => {
    try {
      if (initialLoad) {
        setLoading(true);
      } else if (cursor) {
        setLoadingMore(true);
      }
      
      setError(null);
      
      const params: any = { limit: ITEMS_PER_PAGE };
      if (cursor) {
        params.lastDate = cursor;
      }
      
      const response = await myBookings(params);

      if (response.success && Array.isArray(response.bookings)) {
        const sortedBookings = [...response.bookings].sort(
          (a, b) => new Date(b.bookingTimestamp) - new Date(a.bookingTimestamp)
        );
        
        if (initialLoad) {
          setBookings(sortedBookings);
        } else {
          // Filter out duplicates that might come from overlapping cursor dates
          const newBookings = sortedBookings.filter(newBooking => 
            !bookings.some(existingBooking => existingBooking._id === newBooking._id)
          );
          setBookings(prev => [...prev, ...newBookings]);
        }
        
        setNextCursor(response.nextCursor);
        setHasMore(!!response.nextCursor && response.bookings.length === ITEMS_PER_PAGE);
      } else {
        if (initialLoad) {
          setError('No bookings available');
        }
      }
    } catch (err) {
      setError('Failed to load bookings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setNextCursor(null);
    setHasMore(true);
    fetchBookings(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchBookings(false, nextCursor);
    }
  }, [loadingMore, hasMore, nextCursor]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { bg: 'rgba(212, 175, 55, 0.15)', text: '#D4AF37', border: 'rgba(212, 175, 55, 0.4)' };
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.4)' };
      case 'pending':
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#FB923C', border: 'rgba(251, 146, 60, 0.4)' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const getPaymentStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.4)' };
      case 'partial':
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#FB923C', border: 'rgba(251, 146, 60, 0.4)' };
      case 'pending':
      case 'unpaid':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.4)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const renderBookingItem = ({ item: booking }: { item: any }) => {
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
        activeOpacity={0.95}
        onPress={() => toggleExpand(booking._id)}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isExpanded ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Card Header */}
        <View style={{
          backgroundColor: isExpanded ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 6 }}>
                {booking.shopId?.ShopName || 'Salon Shop'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={12} color="rgba(212, 175, 55, 0.8)" />
                <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400', marginLeft: 6 }}>
                  {formatDate(booking.bookingDate)}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: statusStyle.bg,
                borderWidth: 1,
                borderColor: statusStyle.border,
              }}
            >
              <Text style={{ color: statusStyle.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                {booking.bookingStatus?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Card Content */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Time & Price Row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            {/* Time */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: 'rgba(212, 175, 55, 0.8)', fontWeight: '600', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                Time Slot
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>
                {startTime}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '400', color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                to {endTime}
              </Text>
            </View>

            {/* Price */}
            <View style={{
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: 'rgba(212, 175, 55, 0.4)',
              alignItems: 'flex-end',
            }}>
              <Text style={{ fontSize: 11, color: '#D4AF37', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>
                Total
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#D4AF37', letterSpacing: -0.5 }}>
                ₹{booking.totalPrice || 0}
              </Text>
            </View>
          </View>

          {/* Expand/Collapse Indicator */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          }}>
            <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500', marginRight: 8 }}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: '#D4AF37',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#0A0A0A" />
            </View>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View
            style={{
              padding: 16,
              paddingTop: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Services Section */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="cut-outline" size={16} color="#D4AF37" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF', marginLeft: 8 }}>
                  Services Booked
                </Text>
              </View>

              {(booking.services || []).length > 0 ? (
                booking.services.map((service: any, index: number) => (
                  <View
                    key={service.id || service._id || index}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      paddingVertical: 12,
                      borderBottomWidth: index < booking.services.length - 1 ? 1 : 0,
                      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 4 }}>
                        {service.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={12} color="rgba(212, 175, 55, 0.6)" />
                        <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400', marginLeft: 4 }}>
                          {service.duration} minutes
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#D4AF37' }}>
                      ₹{service.price}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', fontSize: 14, paddingVertical: 8 }}>
                  No services listed
                </Text>
              )}
            </View>

            {/* Booking Details Section */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="information-circle-outline" size={16} color="#D4AF37" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF', marginLeft: 8 }}>
                  Booking Details
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="person-outline" size={14} color="rgba(212, 175, 55, 0.6)" />
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400', marginLeft: 6 }}>Barber</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>
                  {booking.barberId?.BarberName || 'N/A'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={14} color="rgba(212, 175, 55, 0.6)" />
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400', marginLeft: 6 }}>Time Slot</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>
                  {startTime} – {endTime}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="hourglass-outline" size={14} color="rgba(212, 175, 55, 0.6)" />
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400', marginLeft: 6 }}>Total Duration</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>
                  {booking.totalDuration || 0} min
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(212, 175, 55, 0.6)" />
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400', marginLeft: 6 }}>Booked On</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>
                  {booking.bookingTimestamp
                    ? new Date(booking.bookingTimestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Payment Details Section */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="card-outline" size={16} color="#D4AF37" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF', marginLeft: 8 }}>
                  Payment Summary
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400' }}>Amount Paid</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#22C55E' }}>
                  ₹{booking.amountPaid || 0}
                </Text>
              </View>

              {booking.remainingAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400' }}>Remaining</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>
                    ₹{booking.remainingAmount}
                  </Text>
                </View>
              )}

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.1)',
              }}>
                <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '400' }}>Payment Status</Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: getPaymentStyle(booking.paymentStatus).bg,
                    borderWidth: 1,
                    borderColor: getPaymentStyle(booking.paymentStatus).border,
                  }}
                >
                  <Text style={{
                    color: getPaymentStyle(booking.paymentStatus).text,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5
                  }}>
                    {booking.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Booking ID Footer */}
            <View style={{
              marginTop: 12,
              paddingVertical: 10,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 12, color: 'rgba(212, 175, 55, 0.6)', fontWeight: '500', letterSpacing: 1 }}>
                ID: {booking._id.slice(-12).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#D4AF37" />
        <Text style={{ marginTop: 8, textAlign: 'center', color: 'rgba(212, 175, 55, 0.8)', fontSize: 13, letterSpacing: 1 }}>
          LOADING MORE...
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={{ alignItems: 'center', paddingVertical: 80 }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(212, 175, 55, 0.3)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Ionicons name="calendar-outline" size={48} color="rgba(212, 175, 55, 0.6)" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 8 }}>
          No Bookings Yet
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', lineHeight: 22 }}>
          Time to book your next haircut!
        </Text>
      </View>
    );
  };

  const renderErrorState = () => {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginBottom: 24 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => fetchBookings(true)}
          style={{
            backgroundColor: '#D4AF37',
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#0A0A0A', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{ marginTop: 16, color: '#D4AF37', fontSize: 14, fontWeight: '600', letterSpacing: 1 }}>
          LOADING...
        </Text>
      </View>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A']}
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(212, 175, 55, 0.2)',
        }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Home')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#D4AF37" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#D4AF37', marginLeft: 8 }}>
              Home
            </Text>
          </TouchableOpacity>
          
          {/* Booking Count */}
          <View style={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.3)',
          }}>
            <Text style={{ fontSize: 12, color: '#D4AF37', fontWeight: '700', letterSpacing: 1 }}>
              {bookings.length} {bookings.length === 1 ? 'BOOKING' : 'BOOKINGS'}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: 'rgba(212, 175, 55, 0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>
            YOUR APPOINTMENTS
          </Text>
          <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            My Bookings
          </Text>
        </View>
      </LinearGradient>

      {/* Infinite Scroll List */}
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}