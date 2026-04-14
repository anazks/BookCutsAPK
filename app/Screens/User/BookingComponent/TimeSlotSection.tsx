// components/TimeSlotsSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BarberScheduleTimeline from '../BarberScheduleTimeLine'; // adjust path

type TimeSlotsSectionProps = {
  selectedDate: Date;
  selectedBarber: { name: string; avatar?: string } | null;
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
    const [isReloading, setIsReloading] = useState(false);
    const hasSlots = scheduleData?.freeSlots?.length > 0;




    // Format date in a friendly way
    const formatFriendlyDate = (date: Date) => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
      }
    };



    const memoizedHandleTimeSelect = useCallback(
      (timeInfo: any) => {
        setIsReloading(true);
        onTimeSelect(timeInfo);
        // Simulate a brief reload effect
        setTimeout(() => setIsReloading(false), 600);
      },
      [onTimeSelect]
    );

    return (
      <View style={styles.container}>
        {/* Header with Barber Info */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="time" size={18} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.title}>Select Time Slot</Text>
              <Text style={styles.subtitle}>
                {formatFriendlyDate(selectedDate)}
              </Text>
            </View>
          </View>
          
          {selectedBarber && (
            <View style={styles.barberChip}>
              {selectedBarber.avatar ? (
                <Image source={{ uri: selectedBarber.avatar }} style={styles.barberAvatar} />
              ) : (
                <View style={styles.barberAvatarPlaceholder}>
                  <Text style={styles.barberAvatarText}>
                    {selectedBarber.name.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.barberName}>{selectedBarber.name}</Text>
            </View>
          )}
        </View>



        {/* Time Filter Chips */}


        {/* Main Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingAnimation}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
            <Text style={styles.loadingTitle}>Finding available slots</Text>
            <Text style={styles.loadingSubtext}>
              Checking availability for {selectedBarber?.name || 'all barbers'}...
            </Text>
          </View>
        ) : hasSlots ? (
          <View style={styles.timelineContainer}>
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
              onTimeSelect={memoizedHandleTimeSelect}
            />
            
            {isReloading && (
              <View style={styles.selectionOverlay}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSlotsContainer}>
            <View style={styles.noSlotsIconContainer}>
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.noSlotsTitle}>
              No Available Slots
            </Text>
            <Text style={styles.noSlotsText}>
              {selectedBarber?.name
                ? `${selectedBarber.name} doesn't have any available slots on ${formatFriendlyDate(selectedDate)}`
                : 'No barbers have available slots on this date'}
            </Text>
            
            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try:</Text>
              <View style={styles.suggestionChips}>
                <TouchableOpacity style={styles.suggestionChip}>
                  <Ionicons name="calendar" size={12} color="#2563EB" />
                  <Text style={styles.suggestionChipText}>Different date</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionChip}>
                  <Ionicons name="person" size={12} color="#2563EB" />
                  <Text style={styles.suggestionChipText}>Another barber</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionChip}>
                  <Ionicons name="time" size={12} color="#2563EB" />
                  <Text style={styles.suggestionChipText}>Shorter duration</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Peak Hours Info */}
            <View style={styles.peakHoursInfo}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.peakHoursText}>
                Peak hours (6pm-8pm) fill up quickly. Try morning or afternoon slots for better availability.
              </Text>
            </View>
          </View>
        )}

        {/* Quick Tips */}

      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginHorizontal: 14,
    marginVertical: 6,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  barberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  barberAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  barberAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  barberName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },

  // Filter Container
  filterContainer: {
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTime: {
    fontSize: 9,
    color: '#9CA3AF',
    marginLeft: 4,
  },

  // Timeline Container
  timelineContainer: {
    marginTop: 4,
  },

  // Loading States
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  loadingAnimation: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },

  // No Slots State
  noSlotsContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  noSlotsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  noSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  noSlotsText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  suggestionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '500',
  },
  peakHoursInfo: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  peakHoursText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },

  // Tips Container
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  tipsText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  // Selection Overlay
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 10,
  },
});

export default TimeSlotsSection;