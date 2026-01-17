import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ConfirmBooking() {
  const params = useLocalSearchParams();
  const { bookingId, paymentId, paymentType, amount, verified } = params;

  const [seconds, setSeconds] = useState(3);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Success Message */}
      <View style={styles.successContainer}>
        <View style={styles.checkMark}>
          <Text style={styles.checkText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your payment has been processed successfully
        </Text>
      </View>

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownText}>Redirecting to Home in</Text>
        <Text style={styles.countdownNumber}>{seconds}</Text>
        <Text style={styles.countdownText}>seconds</Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>PAYMENT VERIFIED</Text>
        </View>

        {/* Payment Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment ID</Text>
            <Text style={styles.detailValue}>{paymentId || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Type</Text>
            <Text style={styles.detailValue}>
              {formatPaymentType(paymentType)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>{formatAmount(amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.successValue}>Completed</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Booking ID */}
        <View style={styles.bookingIdContainer}>
          <Text style={styles.bookingIdLabel}>Booking ID</Text>
          <Text style={styles.bookingIdValue}>
            {bookingId || 'BK-2024-XXXX'}
          </Text>
        </View>

        {/* Payment Type Info */}
        {paymentType?.toString() === 'advance' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Advance Payment</Text>
            <Text style={styles.infoText}>
              Remaining balance will be collected at the time of service.
            </Text>
          </View>
        )}

        {paymentType?.toString() === 'full' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Full Payment Completed</Text>
            <Text style={styles.infoText}>
              Your booking is fully paid. No additional charges.
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleExploreMore}>
            <Text style={styles.primaryButtonText}>Check Your Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleViewDetails}>
            <Text style={styles.linkButtonText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for choosing us!</Text>
          <Text style={styles.footerSubtext}>
            Confirmation email sent to your inbox
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 60,
    alignItems: 'center',
  },

  successContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  checkMark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkText: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  // ── Countdown ──
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  countdownText: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 4,
  },
  countdownNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#3b82f6',
    lineHeight: 48,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },

  statusBanner: {
    backgroundColor: '#34c759',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  detailsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  successValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34c759',
  },

  bookingIdContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  bookingIdLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  bookingIdValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },

  infoContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },

  buttonContainer: {
    marginBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});