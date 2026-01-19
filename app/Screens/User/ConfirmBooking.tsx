import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

export default function ConfirmBooking() {
  const params = useLocalSearchParams();
  const { bookingId, paymentId, paymentType, amount, verified } = params;

  const [seconds, setSeconds] = useState(10); // Change this number to set countdown duration
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      router.replace('/(tabs)/Home');
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleExploreMore = () => {
    router.push('/Screens/User/Bookings');
  };

  const handleViewDetails = () => {
    router.push({
      pathname: '/Screens/User/BookingDetails',
      params: { bookingId },
    });
  };

  const formatAmount = (amt: string | string[]) => {
    return `₹${parseFloat(amt?.toString() || '0').toLocaleString('en-IN')}`;
  };

  const formatPaymentType = (type: string | string[]) => {
    const t = type?.toString() || '';
    return t === 'advance' ? 'Advance Payment' : 'Full Payment';
  };

  return (
    <View style={styles.container}>
      {/* Corner Countdown */}
      <View style={styles.countdownCorner}>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownNumber}>{seconds}s</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Section */}
        <Animated.View 
          style={[
            styles.successSection,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.successIconWrapper}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your booking has been confirmed successfully
          </Text>
        </Animated.View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountHeader}>
            <Text style={styles.amountLabel}>Total Amount Paid</Text>
            <View style={styles.verifiedBadge}>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.amountValue}>{formatAmount(amount)}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailValue}>
                {bookingId || 'BK-2024-XXXX'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {paymentId?.toString().slice(0, 20) || 'N/A'}...
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Type</Text>
              <Text style={styles.detailValueBold}>
                {formatPaymentType(paymentType)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Date</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Time</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Type Info */}
        {paymentType?.toString() === 'advance' && (
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Text style={styles.infoIcon}>ℹ</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Advance Payment Made</Text>
              <Text style={styles.infoText}>
                The remaining balance will be collected at the time of service delivery.
              </Text>
            </View>
          </View>
        )}

        {paymentType?.toString() === 'full' && (
          <View style={[styles.infoCard, styles.infoCardSuccess]}>
            <View style={[styles.infoIconWrapper, styles.infoIconSuccess]}>
              <Text style={styles.infoIcon}>✓</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Full Payment Completed</Text>
              <Text style={styles.infoText}>
                Your booking is fully paid. No additional charges will be applied.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleExploreMore}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>View All Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleViewDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            A confirmation email has been sent to your registered email address
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  
  // Corner Countdown
  countdownCorner: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  countdownBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countdownNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Success Section
  successSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successIconWrapper: {
    marginBottom: 20,
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  successIconInner: {
    width: 82,
    height: 82,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 42,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '80%',
  },

  // Amount Card
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1e293b',
  },

  // Details Card
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  detailsList: {
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    maxWidth: '55%',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 7,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIconSuccess: {
    backgroundColor: '#16a34a',
  },
  infoIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoContent: {
    flex: 1,
    paddingTop: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  // Buttons
  buttonGroup: {
    gap: 12,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
  },
});