import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ConfirmBooking() {
  const params = useLocalSearchParams();
  const {
    bookingId,
    paymentId,
    paymentType,
    amount,
    verified,
    barberName,
    bookingDate,
    timeSlot,
    serviceName,
    serviceDuration,
  } = params;

  const formatAmount = (amt: string | string[]) => {
    return `₹${parseFloat(amt?.toString() || '0').toLocaleString('en-IN')}`;
  };

  const formatPaymentType = (type: string | string[]) => {
    const t = type?.toString() || '';
    return t === 'advance' ? 'Advance Payment' : 'Full Payment';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed</Text>
          <Text style={styles.successSubtitle}>
            Your appointment is successfully scheduled
          </Text>
        </View>

        {/* Appointment Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Appointment Summary</Text>

          <View style={styles.summaryRow}>
            <Ionicons name="cut-outline" size={20} color="#64748B" />
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{serviceName || 'Standard Service'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="person-outline" size={20} color="#64748B" />
            <Text style={styles.summaryLabel}>Barber</Text>
            <Text style={styles.summaryValue}>{barberName || 'Unknown'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{bookingDate || '--/--/----'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={20} color="#64748B" />
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{timeSlot || '--:--'}</Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.totalLabel}>Amount Paid</Text>
            <Text style={styles.totalValue}>{formatAmount(amount || '')}</Text>
          </View>
        </View>

        {/* Time Slots Timeline (simplified for confirmation) */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Confirmed Time Slot</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>{timeSlot || '--:--'}</Text>
              <Text style={styles.timelineService}>{serviceName || 'Service'} • {serviceDuration ? `${serviceDuration} min` : ''}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Type</Text>
            <Text style={styles.paymentValue}>{formatPaymentType(paymentType)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Booking ID</Text>
            <Text style={styles.paymentValue}>{bookingId || '—'}</Text>
          </View>

          {paymentType?.toString() === 'advance' && (
            <Text style={styles.advanceNote}>
              Remaining balance will be collected at the salon
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/Home')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push({
              pathname: '/Screens/User/BookingDetails',
              params: { bookingId: String(bookingId) },
            })}
          >
            <Text style={styles.primaryButtonText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          A confirmation has been sent to your email
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Success Header
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },

  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },

  successSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },

  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 16,
  },

  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },

  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },

  // Timeline Section
  timelineSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  timelineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },

  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  timelineDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  timelineContent: {
    flex: 1,
  },

  timelineTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },

  timelineService: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  // Payment Info
  paymentInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  paymentLabel: {
    fontSize: 14,
    color: '#64748B',
  },

  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },

  advanceNote: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 12,
    textAlign: 'center',
  },

  // Buttons
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },

  secondaryButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer Note
  footerNote: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
