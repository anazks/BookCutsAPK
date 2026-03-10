// components/TimeSlotsSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BarberScheduleTimeline from '../BarberScheduleTimeLine'; // adjust path

type TimeSlotsSectionProps = {
  selectedDate: Date;
  selectedBarber: { name: string } | null;
  scheduleData: any;
  totalDuration: number;
  loading: boolean;
  onTimeSelect: (timeInfo: any) => void;
};

export const TimeSlotsSection = memo(
  ({
    selectedDate,
    selectedBarber,
    scheduleData,
    totalDuration,
    loading,
    onTimeSelect,
  }: TimeSlotsSectionProps) => {
    const hasSlots = scheduleData?.freeSlots?.length > 0;

    // Memoize the handler to prevent re-creation on every render
    const handleTimeSelect = useCallback(
      (timeInfo: any) => {
        onTimeSelect(timeInfo);
      },
      [onTimeSelect]
    );

    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Available Time Slots{' '}
            {selectedBarber?.name ? `for ${selectedBarber.name}` : '(Any Barber)'}
          </Text>
          <Text style={styles.dateDisplay}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Loading available slots...</Text>
          </View>
        ) : hasSlots ? (
          <BarberScheduleTimeline
            totalDuration={totalDuration}
            scheduleData={scheduleData}
            availableDurations={[30, 60, 90, 120]}
            title="Choose Your Time Slot"
            date={selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            onTimeSelect={handleTimeSelect} // stable handler
          />
        ) : (
          <View style={styles.noSlotsContainer}>
            <Ionicons name="time-outline" size={48} color="#CBD5E1" />
            <Text style={styles.noSlotsText}>
              {selectedBarber?.name
                ? `No available slots for ${selectedBarber.name} on this date`
                : 'No available slots for any barber on this date'}
            </Text>
            <Text style={styles.noSlotsSubtext}>
              Try a different date or barber
            </Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16, // reduced from 100
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dateDisplay: {
    fontSize: 14,
    color: '#64748B',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  noSlotsContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});