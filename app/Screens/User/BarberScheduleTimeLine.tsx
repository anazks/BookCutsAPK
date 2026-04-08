import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BarberScheduleTimeLine = ({
  scheduleData = {
    workHours: { from: "09:00", to: "18:00" },
    breaks: [],
    bookings: [],
    freeSlots: []
  } as any,
  totalDuration = 60 as number,
  onTimeSelect,
}: any) => {

  console.log('Schedule Data Received:', scheduleData);
console.log('Free Slots:', scheduleData.freeSlots);
console.log('Total Duration:', totalDuration);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const isSlotBlocked = (startMin: number, endMin: number) => {
    for (const booking of scheduleData.bookings || []) {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      if (!(endMin <= bookingStart || startMin >= bookingEnd)) {
        return true;
      }
    }
    
    for (const breakTime of scheduleData.breaks || []) {
      const breakStart = timeToMinutes(breakTime.startTime);
      const breakEnd = timeToMinutes(breakTime.endTime);
      if (!(endMin <= breakStart || startMin >= breakEnd)) {
        return true;
      }
    }
    
    return false;
  };

  const generateTimeSlots = useMemo(() => {
    const slots: any[] = [];
    
    (scheduleData.freeSlots || []).forEach((freeSlot: any) => {
      const startMin = timeToMinutes(freeSlot.from);
      const endMin = timeToMinutes(freeSlot.to);
      const duration = endMin - startMin;
      
      const numSlots = Math.floor(duration / totalDuration);
      
      for (let i = 0; i < numSlots; i++) {
        const slotStartMin = startMin + (i * totalDuration);
        const slotEndMin = slotStartMin + totalDuration;
        
        const isAvailable = !isSlotBlocked(slotStartMin, slotEndMin);
        
        if (isAvailable) {
          slots.push({
            startTime: minutesToTime(slotStartMin),
            endTime: minutesToTime(slotEndMin),
            startMinutes: slotStartMin,
            endMinutes: slotEndMin,
            duration: totalDuration,
          });
        }
      }
    });
    
    return slots;
  }, [scheduleData, totalDuration]);

  const handleSlotPress = (slot: any) => {
    setSelectedSlot(slot);
    if (onTimeSelect) {
      onTimeSelect(slot);
    }
  };

  // Convert time to user friendly string e.g. "10:30 AM"
  const formatCompactTime = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeOfDay = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const groupedSlots = useMemo(() => {
    const groups: Record<string, any[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    
    generateTimeSlots.forEach(slot => {
      const timeOfDay = getTimeOfDay(slot.startTime);
      groups[timeOfDay].push(slot);
    });
    
    return groups;
  }, [generateTimeSlots]);

const getPeriodIcon = (period: string) => {
  switch(period) {
    case 'morning': 
      return <Feather name="sunrise" size={14} color="#1877F2" />; // Primary blue
    case 'afternoon': 
      return <MaterialIcons name="wb-sunny" size={16} color="#5C9CFF" />; // Light blue
    case 'evening': 
      return <Feather name="moon" size={14} color="#0F4FA6" />; // Dark blue
    default: 
      return <Feather name="clock" size={14} color="#8AB8FF" />; // Very light blue
  }
};

const getPeriodColor = (period: string) => {
  switch(period) {
    case 'morning': return '#1877F2'; // Primary blue
    case 'afternoon': return '#5C9CFF'; // Light blue
    case 'evening': return '#0F4FA6'; // Dark blue
    default: return '#8AB8FF'; // Very light blue
  }
};

  const renderTimeSlot = (slot: any, period: string, index: number) => {
    const isSelected = selectedSlot?.startTime === slot.startTime;
    const periodColor = getPeriodColor(period);
    
    return (
      <TouchableOpacity
        key={`${period}-${index}`}
        style={[
          styles.timeSlotCard,
          isSelected && [styles.timeSlotCardSelected, { borderColor: periodColor }],
        ]}
        onPress={() => handleSlotPress(slot)}
        activeOpacity={0.7}
      >
        <View style={styles.timeSlotContent}>
          {/* Single line for start time */}
          <View style={styles.timeContainer}>
            <Text style={[
              styles.timeText,
              isSelected && [styles.timeTextSelected, { color: periodColor }]
            ]}>
              {formatCompactTime(slot.startTime)}
            </Text>
          </View>
          
          {/* Duration or selected indicator */}
          <View style={styles.statusContainer}>
            {isSelected ? (
              <View style={[styles.selectedIndicator, { backgroundColor: periodColor }]}>
                <Feather name="check" size={8} color="#FFFFFF" />
              </View>
            ) : (
              <Text style={[styles.durationText, { color: periodColor }]}>
                {slot.duration}m
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPeriodSection = (period: string, slots: any[]) => {
    if (slots.length === 0) return null;
    const periodColor = getPeriodColor(period);
    
    return (
      <View key={period} style={styles.periodSection}>
        <View style={styles.periodHeader}>
          <View style={[styles.periodIcon, { backgroundColor: periodColor + '15' }]}>
            {getPeriodIcon(period)}
          </View>
          <Text style={[styles.periodTitle, { color: periodColor }]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
          <View style={[styles.slotCountBadge, { backgroundColor: periodColor + '15' }]}>
            <Text style={[styles.slotCountText, { color: periodColor }]}>
              {slots.length}
            </Text>
          </View>
        </View>
        
        <View style={styles.timeSlotsGrid}>
          {slots.map((slot, index) => renderTimeSlot(slot, period, index))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Feather name="scissors" size={18} color="#5C9CFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Available Times</Text>
              <Text style={styles.headerSubtitle}>
                {generateTimeSlots.length} slots • {totalDuration} min duration
              </Text>
            </View>
          </View>
          
          <View style={styles.workingHours}>
            <Feather name="clock" size={12} color="#666666" />
            <Text style={styles.workingHoursText}>
              {scheduleData.workHours.from} - {scheduleData.workHours.to}
            </Text>
          </View>
        </View>

        {/* Time Slots Grid */}
        <View style={styles.timeSlotsContainer}>
          {renderPeriodSection('morning', groupedSlots.morning)}
          {renderPeriodSection('afternoon', groupedSlots.afternoon)}
          {renderPeriodSection('evening', groupedSlots.evening)}
          
          {generateTimeSlots.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={28} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No time slots</Text>
              <Text style={styles.emptySubtitle}>Try different duration</Text>
            </View>
          )}
        </View>

        {/* Selected Slot Display */}
        {selectedSlot && (
          <View style={styles.selectedDisplay}>
            <View style={styles.selectedHeader}>
              <Feather name="check-circle" size={14} color="#5C9CFF" />
              <Text style={styles.selectedTitle}>Selected time</Text>
            </View>
            <Text style={styles.selectedTime}>
              {formatCompactTime(selectedSlot.startTime)} - {formatCompactTime(selectedSlot.endTime)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FF3B3010',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  workingHours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workingHoursText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  timeSlotsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  periodSection: {
    marginBottom: 14,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  periodIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  periodTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  slotCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotCard: {
    width: (SCREEN_WIDTH - 50) / 3, // 3 columns
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    minHeight: 56, // Slightly smaller
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotCardSelected: {
    backgroundColor: '#EFF6FF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderColor: '#2563EB',
  },
  timeSlotContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  timeTextSelected: {
    fontWeight: '800',
  },
  arrowContainer: {
    marginHorizontal: 4,
  },
  statusContainer: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 9,
    fontWeight: '700',
  },
  selectedIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#C7C7CC',
  },
  selectedDisplay: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 6,
  },
  selectedTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
});

export default BarberScheduleTimeLine;