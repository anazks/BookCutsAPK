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

import { addMinutesToTime } from '../BookingComponent/dateTimeHelpers';

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
  finalTotal,
  discountAmount,
  hasDiscount,
}: BookingConfirmationModalProps) => {
  if (!visible) return null;

  const endTime = selectedStartTime
    ? addMinutesToTime(selectedStartTime, totalDuration)
    : '';

  const servicesText = selectedServices.map(s => s.name).join(', ') || '—';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header – minimal & professional */}
          <View style={styles.header}>
            <Text style={styles.title}> Appointment Details</Text>
          </View>

          {/* Summary – compact */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Ionicons name="cut-outline" size={18} color="#4B5563" />
              <Text style={styles.label}>Services</Text>
              <Text style={styles.value} numberOfLines={2}>
                {servicesText}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={18} color="#4B5563" />
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="person-outline" size={18} color="#4B5563" />
              <Text style={styles.label}>Barber</Text>
              <Text style={styles.value}>
                {selectedBarber?.name || 'Any Available'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={18} color="#4B5563" />
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>
                {selectedStartTime ? `${selectedStartTime} – ${endTime}` : '—'}
              </Text>
            </View>

            {/* Total – compact but clear */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <View style={styles.totalRight}>
                <Text style={styles.totalValue}>₹{finalTotal.toLocaleString('en-IN')}</Text>
                {hasDiscount && (
                  <Text style={styles.discountText}>
                    –₹{discountAmount.toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Buttons – professional & compact */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              disabled={isBooking}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isBooking && styles.primaryDisabled]}
              onPress={onConfirm}
              disabled={isBooking}
            >
              {isBooking ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>Preparing...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },

  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },

  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },

  label: {
    width: 80,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  value: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'right',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  discountText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },

  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  primaryDisabled: {
    backgroundColor: '#93C5FD',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});