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
  isValid: boolean;
  isBooking: boolean;
  onBookPress: () => void;
  currentStep?: number;
  onNext?: () => void;
  onBack?: () => void;
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
  currentStep = 4,
  onNext,
  onBack,
}: BookingFooterProps) => {
  // Only show preview on step 4 to keep it clean, or keep it always? 
  // Let's hide the complex preview if we are keeping a step-by-step
  // Actually, keeping the preview is nice, but maybe only show it on step 4.
  const showPreview = currentStep === 4 && (servicesCount > 0 || selectedDate || selectedBarber);

  const primaryAction = currentStep < 4 && onNext ? onNext : onBookPress;
  const primaryText = currentStep < 4 ? 'Next' : 'Book Appointment';

  return (
    <View style={styles.footer}>
      {showPreview && (
        <View style={styles.bookingPreview}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Appointment Summary</Text>
            <View style={styles.priceContainer}>
              {hasDiscount && (
                <View style={styles.previewDiscountBadge}>
                  <Text style={styles.previewDiscountText}>-₹{discountAmount}</Text>
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
                <Text style={styles.previewText}>{selectedBarber.name}</Text>
              </View>
            )}
            {selectedStartTime && (
              <View style={styles.previewChip}>
                <Ionicons name="time" size={14} color="#3B82F6" />
                <Text style={styles.previewText}>{selectedStartTime}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Button Row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {currentStep > 1 && onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isBooking}
          >
            <Ionicons name="chevron-back" size={24} color="#475569" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.bookButton,
            { flex: 1 },
            !isValid && styles.bookButtonDisabled,
            isBooking && styles.bookButtonLoading,
          ]}
          onPress={primaryAction}
          disabled={!isValid || isBooking}
          activeOpacity={0.78}
        >
          {isBooking ? (
            <Text style={styles.bookButtonText}>Processing...</Text>
          ) : isValid ? (
            <View style={styles.bookButtonContent}>
              <Text style={styles.bookButtonText}>{primaryText}</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </View>
          ) : (
            <Text style={styles.bookButtonText}>{currentStep < 4 ? 'Complete step to continue' : 'Complete details to book'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },

  // ── Preview styles (unchanged) ──
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

  // ── New normal button styles ──
  bookButton: {
    height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
  bookButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.12,
  },
  bookButtonLoading: {
    backgroundColor: '#60A5FA',
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: '#F1F5F9',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});