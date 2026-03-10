// components/BookingConfirmationModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Assume this helper is imported from your utils file
import { addMinutesToTime } from '../BookingComponent/dateTimeHelpers'; // adjust path as needed

type BookingConfirmationModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isBooking: boolean;
  selectedServices: Array<{ name: string }>;
  selectedDate: Date | null;
  selectedBarber: { name: string } | null;
  selectedStartTime: string | null;
  totalDuration: number;
  baseTotal: number;
  finalTotal: number;
  discountAmount: number;
  hasDiscount: boolean;
};

export const BookingConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  isBooking,
  selectedServices,
  selectedDate,
  selectedBarber,
  selectedStartTime,
  totalDuration,
  baseTotal,
  finalTotal,
  discountAmount,
  hasDiscount,
}: BookingConfirmationModalProps) => {
  if (!visible) return null;

  const endTime = selectedStartTime
    ? addMinutesToTime(selectedStartTime, totalDuration)
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Booking Confirmed</Text>
            <Text style={styles.subtitle}>
              Your appointment is successfully scheduled
            </Text>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Appointment Summary</Text>

            <View style={styles.summaryRow}>
              <Ionicons name="cut-outline" size={20} color="#64748B" />
              <Text style={styles.summaryLabel}>Services</Text>
              <Text style={styles.summaryValue}>
                {selectedServices.map(s => s.name).join(', ') || '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {selectedDate?.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) || '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
              <Text style={styles.summaryLabel}>Barber</Text>
              <Text style={styles.summaryValue}>
                {selectedBarber?.name || 'Any Available'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>
                {selectedStartTime ? `${selectedStartTime} – ${endTime}` : '—'}
              </Text>
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
              {hasDiscount && (
                <Text style={styles.discountText}>
                  (Saved ₹{discountAmount.toLocaleString('en-IN')})
                </Text>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isBooking}
            >
              <Text style={styles.cancelButtonText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, isBooking && styles.confirmDisabled]}
              onPress={onConfirm}
              disabled={isBooking}
            >
              {isBooking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },

  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#EFF6FF',
  },

  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },

  summaryCard: {
    padding: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
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

  totalSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 8,
  },

  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563EB',
  },

  discountText: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 4,
  },

  buttonGroup: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  confirmButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  confirmDisabled: {
    backgroundColor: '#93C5FD',
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
});