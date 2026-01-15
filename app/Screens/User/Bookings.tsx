import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { myBookings } from '../../api/Service/Booking';

// Enable smooth animations on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await myBookings();

      if (response.success && Array.isArray(response.bookings)) {
        const sortedBookings = [...response.bookings].sort(
          (a, b) => new Date(b.bookingTimestamp) - new Date(a.bookingTimestamp)
        );
        setBookings(sortedBookings);
      } else {
        setError('No bookings available');
      }
    } catch (err) {
      setError('Failed to load bookings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'completed':
        return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
  };

  const getPaymentStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { bg: '#ECFDF5', text: '#059669' };
      case 'partial':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'pending':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 16, fontWeight: '500' }}>
            Loading your bookings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#FEE2E2',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 32 }}>⚠️</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
            Oops! Something went wrong
          </Text>
          <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchBookings}
            style={{
              backgroundColor: '#4F46E5',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 14,
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Modern Header with Gradient Effect */}
      <View
        style={{
          backgroundColor: '#4F46E5',
          paddingTop: 20,
          paddingBottom: 40,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
          My Bookings
        </Text>
        <Text style={{ fontSize: 15, color: '#C7D2FE', marginTop: 6, fontWeight: '500' }}>
          {bookings.length} {bookings.length === 1 ? 'appointment' : 'appointments'} found
        </Text>
      </View>

      {/* Bookings List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
      >
        {bookings.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <Text style={{ fontSize: 56 }}>📅</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 }}>
              No Bookings Yet
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 }}>
              Time to book your next haircut! 💇‍♂️
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
                activeOpacity={0.92}
                onPress={() => toggleExpand(booking._id)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  marginBottom: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: isExpanded ? '#4F46E5' : '#F3F4F6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: isExpanded ? 12 : 4 },
                  shadowOpacity: isExpanded ? 0.15 : 0.08,
                  shadowRadius: isExpanded ? 24 : 12,
                  elevation: isExpanded ? 12 : 4,
                }}
              >
                {/* Card Header */}
                <View style={{
                  backgroundColor: statusStyle.bg,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: statusStyle.border,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 3 }}>
                        {booking.barber?.name || 'Barber'}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                        {booking.shop?.ShopName || 'Salon Shop'}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1.5,
                        borderColor: statusStyle.text,
                      }}
                    >
                      <Text style={{ color: statusStyle.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                        {booking.bookingStatus?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Main Card Content */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                  {/* Date, Time & Price - Single Row */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    {/* Date */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                        DATE
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                        {formatDate(booking.bookingDate)}
                      </Text>
                    </View>

                    {/* Time */}
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                        TIME
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                        {startTime}
                      </Text>
                    </View>

                    {/* Price - Compact */}
                    <View style={{
                      backgroundColor: '#EEF2FF',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#C7D2FE',
                    }}>
                      <Text style={{ fontSize: 10, color: '#818CF8', fontWeight: '700', letterSpacing: 0.5, marginBottom: 2, textAlign: 'center' }}>
                        TOTAL
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#4F46E5', letterSpacing: -0.5 }}>
                        ₹{booking.totalPrice || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Expand/Collapse Indicator */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                  }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginRight: 6 }}>
                      {isExpanded ? 'Less Details' : 'More Details'}
                    </Text>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#F3F4F6',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>
                        {isExpanded ? '−' : '+'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View
                    style={{
                      padding: 20,
                      paddingTop: 0,
                      backgroundColor: '#FAFAFA',
                    }}
                  >
                    {/* Services Section */}
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}>
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#4F46E5',
                          marginRight: 8,
                        }} />
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                          Services Booked
                        </Text>
                      </View>

                 {(booking.services || []).length > 0 ? (
    booking.services.map((service, index) => (
      <View
        key={service.id || service._id || index}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
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
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#4F46E5' }}>
          ₹{service.price}
        </Text>
      </View>
    ))
  ) : (
    <Text style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 14, paddingVertical: 12 }}>
      No services listed
    </Text>
  )}

  {/* Divider */}
  <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

  {/* Booking Details: Time Slot & Booked On */}
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
    <Text style={{ fontSize: 14, color: '#4B5563' }}>Time Slot</Text>
    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
      {booking.timeSlot?.startingTime} – {booking.timeSlot?.endingTime}
    </Text>
  </View>

  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ fontSize: 14, color: '#4B5563' }}>Booked On</Text>
    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
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
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}>
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#10B981',
                          marginRight: 8,
                        }} />
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                          Payment Summary
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Amount Paid</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#10B981' }}>
                          ₹{booking.amountPaid || 0}
                        </Text>
                      </View>

                      {booking.remainingAmount > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Remaining</Text>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#EF4444' }}>
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
                        borderTopColor: '#F3F4F6',
                      }}>
                        <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Payment Status</Text>
                        <View
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            borderRadius: 12,
                            ...getPaymentStyle(booking.paymentStatus),
                          }}
                        >
                          <Text style={{
                            color: getPaymentStyle(booking.paymentStatus).text,
                            fontSize: 12,
                            fontWeight: '800',
                            letterSpacing: 0.3
                          }}>
                            {booking.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Footer Info */}
                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', textAlign: 'center' }}>
                        Booked on {formatDate(booking.bookingTimestamp)}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4, fontWeight: '600' }}>
                        ID: {booking._id.slice(-8).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}