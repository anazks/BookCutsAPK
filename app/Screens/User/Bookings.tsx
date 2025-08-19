import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { myBookings } from '../../api/Service/Booking';

export default function Bookings() {
  const [bookingsData, setBookingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await myBookings();
      if (response.success) {
        setBookingsData(response);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (id) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'partial': return '#FF9800';
      case 'pending': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const BookingCard = ({ booking }) => {
    const isExpanded = expandedCard === booking._id;
    const rotateAnimation = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg']
    });

    return (
      <TouchableOpacity 
        style={[
          styles.bookingCard, 
          isExpanded && styles.expandedCard
        ]} 
        activeOpacity={0.9}
        onPress={() => toggleCard(booking._id)}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.barberName}>{booking.barberName}</Text>
            <Text style={styles.nativePlace}>{booking.barberNativePlace}</Text>
            {booking.shopDetails && (
              <Text style={styles.shopName}>{booking.shopDetails.ShopName}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.bookingStatus) }]}>
              <Text style={styles.statusText}>{booking.bookingStatus.toUpperCase()}</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: rotateAnimation }] }}>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </Animated.View>
          </View>
        </View>

        {/* Basic Info (always visible) */}
        <View style={styles.basicInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{formatDate(booking.bookingDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>
              {formatTime(booking.timeSlotStart)} - {formatTime(booking.timeSlotEnd)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount:</Text>
            <Text style={[styles.infoValue, styles.totalAmount]}>₹{booking.totalPrice}</Text>
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Time Slot Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Slot</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Slot Name:</Text>
                <Text style={styles.detailValue}>{booking.timeSlotName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{booking.totalDuration} minutes</Text>
              </View>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              {booking.services && booking.services.length > 0 ? (
                booking.services.map((service, index) => (
                  <View key={service._id || index} style={styles.serviceItem}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDetails}>
                      ₹{service.price} • {service.duration} min
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noServicesText}>No services listed</Text>
              )}
            </View>

            {/* Shop Details */}
            {booking.shopDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shop Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shop:</Text>
                  <Text style={styles.detailValue}>{booking.shopDetails.ShopName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{booking.shopDetails.City}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timing:</Text>
                  <Text style={styles.detailValue}>{booking.shopDetails.Timing}</Text>
                </View>
                {booking.shopDetails.Mobile && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailValue}>{booking.shopDetails.Mobile}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Payment Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Type:</Text>
                <Text style={styles.detailValue}>{booking.paymentType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount to Pay:</Text>
                <Text style={[styles.detailValue, styles.paidAmount]}>₹{booking.amountToPay}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Paid:</Text>
                <Text style={[styles.detailValue, styles.paidAmount]}>₹{booking.amountPaid}</Text>
              </View>
              {booking.remainingAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining:</Text>
                  <Text style={[styles.detailValue, styles.remainingAmount]}>₹{booking.remainingAmount}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(booking.paymentStatus) }]}>
                  <Text style={styles.paymentStatusText}>{booking.paymentStatus.toUpperCase()}</Text>
                </View>
              </View>
              {booking.paymentId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment ID:</Text>
                  <Text style={styles.detailValue}>{booking.paymentId}</Text>
                </View>
              )}
            </View>

            {/* Additional Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Info</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking ID:</Text>
                <Text style={styles.detailValue}>{booking._id.toString().slice(-8)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booked On:</Text>
                <Text style={styles.detailValue}>{formatDate(booking.bookingTimestamp)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Currency:</Text>
                <Text style={styles.detailValue}>{booking.currency}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = {
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      backgroundColor: '#FF6B6B',
      paddingVertical: 20,
      paddingHorizontal: 16,
      elevation: 2,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#ecf0f1',
      textAlign: 'center',
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
    },
    bookingCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    expandedCard: {
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerLeft: {
      flex: 1,
    },
    barberName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2c3e50',
    },
    nativePlace: {
      fontSize: 13,
      color: '#7f8c8d',
      marginTop: 2,
    },
    shopName: {
      fontSize: 12,
      color: '#3498db',
      marginTop: 2,
      fontStyle: 'italic',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    expandIcon: {
      fontSize: 14,
      color: '#7f8c8d',
    },
    basicInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    infoRow: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: '#7f8c8d',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#34495e',
    },
    totalAmount: {
      fontWeight: '600',
      color: '#2c3e50',
    },
    expandedContent: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#ecf0f1',
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: 8,
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f2f3',
    },
    serviceName: {
      fontSize: 14,
      color: '#34495e',
    },
    serviceDetails: {
      fontSize: 13,
      color: '#7f8c8d',
    },
    noServicesText: {
      fontSize: 13,
      color: '#7f8c8d',
      fontStyle: 'italic',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    detailLabel: {
      fontSize: 13,
      color: '#7f8c8d',
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '500',
      color: '#34495e',
    },
    paymentStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    paymentStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    paidAmount: {
      color: '#27ae60',
    },
    remainingAmount: {
      color: '#e74c3c',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#e74c3c',
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#3498db',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    retryText: {
      color: '#fff',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: 20,
    },
    bookNowButton: {
      backgroundColor: '#3498db',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 6,
    },
    bookNowText: {
      color: '#fff',
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2c3e50" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Your appointment history</Text>
      </View>

      {/* Bookings List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bookingsData?.bookings?.length > 0 ? (
          bookingsData.bookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>You haven't made any bookings yet</Text>
            <TouchableOpacity style={styles.bookNowButton}>
              <Text style={styles.bookNowText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}