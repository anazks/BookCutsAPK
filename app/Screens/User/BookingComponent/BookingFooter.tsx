// components/BookingFooter.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type BookingFooterProps = {
  servicesCount: number;
  selectedDate: Date | null;
  selectedBarber: { name: string } | null;
  selectedStartTime: string | null;
  finalTotal: number;
  hasDiscount: boolean;
  discountAmount: number;
  isValid: boolean;           // whether all required fields are filled
  isBooking: boolean;
  onBookPress: () => void;
};

export const BookingFooter = ({
  servicesCount,
  selectedDate,
  selectedBarber,
  selectedStartTime,
  finalTotal,
  hasDiscount,
  discountAmount,
  isValid,
  isBooking,
  onBookPress,
}: BookingFooterProps) => {
  const showPreview = servicesCount > 0 || selectedDate || selectedBarber;

  return (
    <View style={styles.footer}>
      {showPreview && (
        <View style={styles.bookingPreview}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Appointment Summary</Text>

            <View style={styles.priceContainer}>
              {hasDiscount && (
                <View style={styles.previewDiscountBadge}>
                  <Text style={styles.previewDiscountText}>
                    -₹{discountAmount}
                  </Text>
                </View>
              )}
              <Text style={styles.previewPrice}>₹{finalTotal}</Text>
            </View>
          </View>

          <View style={styles.previewDetails}>
            {servicesCount > 0 && (
              <View style={styles.previewChip}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.previewText}>
                  {servicesCount} service{servicesCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {selectedDate && (
              <View style={styles.previewChip}>
                <Ionicons name="calendar" size={14} color="#3B82F6" />
                <Text style={styles.previewText}>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}

            {selectedBarber && (
              <View style={styles.previewChip}>
                <Ionicons name="person" size={14} color="#8B5CF6" />
                <Text style={styles.previewText}>
                  {selectedBarber.name}
                </Text>
              </View>
            )}

            {selectedStartTime && (
              <View style={styles.previewChip}>
                <Ionicons name="time" size={14} color="#3B82F6" />
                <Text style={styles.previewText}>
                  {selectedStartTime}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.bookButton,
          !isValid && styles.disabledButton,
        ]}
        onPress={onBookPress}
        disabled={!isValid || isBooking}
        activeOpacity={0.85}
      >
        <View style={styles.bookButtonContent}>
          <Ionicons name="calendar" size={22} color="#FFFFFF" />
          <Text style={styles.bookButtonText}>
            {isBooking ? 'Processing...' : 'Book Appointment'}
          </Text>
        </View>

        {finalTotal > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{finalTotal}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  bookingPreview: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewDiscountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  previewDiscountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  previewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  previewText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.15,
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  priceBadge: {
    position: 'absolute',
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});