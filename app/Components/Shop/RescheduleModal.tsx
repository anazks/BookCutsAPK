import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getBarberFreeTime, suggestReschedule } from '../../api/Service/Booking';
import ManualCalendar from '../../Screens/User/BookingComponent/ManualCalender';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: '#FFFFFF', 
  card: '#FFFFFF',
  primary: '#1877F2',
  primaryLight: '#5C9CFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#F0F0F0',
  white: '#FFFFFF',
  danger: '#FF3B30'
};

const formatDateToDisplay = (date) => {
  const options = { weekday: 'short', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
};

// Compact time formatter (e.g. 10:30 AM)
const formatCompactTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const RescheduleModal = ({ visible, onClose, bookingId, booking, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarVisible, setCalendarVisibility] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchSlots = async (date) => {
    console.log('--- fetchSlots called for', date, '---');
    console.log('booking object:', booking ? { id: booking.id, shopId: booking.shopId, barberId: booking.barberId } : null);
    
    if (!booking || !booking.shopId || !booking.barberId) {
      console.log('--- fetchSlots aborted: Missing booking, shopId, or barberId ---');
      return;
    }
    
    // Sometimes backend populates barberId as an object { _id, BarberName }
    const actualBarberId = typeof booking.barberId === 'object' ? booking.barberId._id : booking.barberId;
    
    if (!actualBarberId) {
      console.log('--- fetchSlots aborted: actualBarberId is missing ---');
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      
      const data = await getBarberFreeTime(actualBarberId, formattedDate, booking.shopId);
      
      console.log('--- GET BARBER FREE TIME RESPONSE for', formattedDate, '---');
      console.log(JSON.stringify(data, null, 2));
      
      let fetchedSlots = [];
      if (data?.availableHours?.schedule?.freeSlots) {
        fetchedSlots = data.availableHours.schedule.freeSlots;
      } else if (data?.availableSlots?.schedule?.freeSlots) {
        fetchedSlots = data.availableSlots.schedule.freeSlots;
      } else if (data?.schedule?.freeSlots) {
        fetchedSlots = data.schedule.freeSlots;
      } else if (Array.isArray(data?.availableHours)) {
        fetchedSlots = data.availableHours;
      } else if (Array.isArray(data?.availableSlots)) {
        fetchedSlots = data.availableSlots;
      } else if (Array.isArray(data)) {
        fetchedSlots = data;
      }
      
      // We get large chunks of free time (e.g. { from: "09:00", to: "12:00" })
      // We need to slice them into slots of the booking's duration.
      const totalDuration = parseInt(booking?.duration || '30', 10) || 30;
      
      const generatedSlots = [];
      
      fetchedSlots.forEach(s => {
        const startTimeStr = s.from || s.start || s.startTime;
        const endTimeStr = s.to || s.end || s.endTime;
        if (!startTimeStr || !endTimeStr) return;
        
        const startMin = timeToMinutes(startTimeStr);
        const endMin = timeToMinutes(endTimeStr);
        const chunkDuration = endMin - startMin;
        
        const numSlots = Math.floor(chunkDuration / totalDuration);
        
        for (let i = 0; i < numSlots; i++) {
          const slotStartMin = startMin + (i * totalDuration);
          const slotEndMin = slotStartMin + totalDuration;
          generatedSlots.push({
            start: minutesToTime(slotStartMin),
            end: minutesToTime(slotEndMin),
            duration: totalDuration,
          });
        }
      });

      setSlots(generatedSlots);
    } catch (e) {
      console.error('Failed to fetch slots', e);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (visible && booking && selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [visible, booking, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }
    try {
      // Combine selectedDate and selectedSlot.start ("HH:mm") into a full Date object
      const [hours, minutes] = selectedSlot.start.split(':').map(Number);
      const suggestionDateTime = new Date(selectedDate);
      suggestionDateTime.setHours(hours, minutes, 0, 0);

      const payload = {
        bookingId,
        suggestedTime: suggestionDateTime.toISOString(),
        reason,
      };
      const response = await suggestReschedule(payload);
      if (response?.success) {
        onSuccess && onSuccess();
        onClose();
      } else {
        alert(response?.message || 'Failed to suggest reschedule');
      }
    } catch (e) {
      console.error(e);
      alert('Error while suggesting reschedule');
    }
  };

  const getTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const groupedSlots = useMemo(() => {
    const groups = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    
    slots.forEach(slot => {
      const timeOfDay = getTimeOfDay(slot.start);
      groups[timeOfDay].push(slot);
    });
    
    return groups;
  }, [slots]);

  const getPeriodIcon = (period) => {
    switch(period) {
      case 'morning': 
        return <Feather name="sunrise" size={14} color="#1877F2" />;
      case 'afternoon': 
        return <MaterialIcons name="wb-sunny" size={16} color="#5C9CFF" />;
      case 'evening': 
        return <Feather name="moon" size={14} color="#0F4FA6" />;
      default: 
        return <Feather name="clock" size={14} color="#8AB8FF" />;
    }
  };

  const getPeriodColor = (period) => {
    switch(period) {
      case 'morning': return '#1877F2';
      case 'afternoon': return '#5C9CFF';
      case 'evening': return '#0F4FA6';
      default: return '#8AB8FF';
    }
  };

  const renderTimeSlot = (slot, period, index) => {
    const isSelected = selectedSlot?.start === slot.start;
    const periodColor = getPeriodColor(period);
    
    // Check if this slot is the original booking slot
    let isCurrentSlot = false;
    if (booking?.rawStartTime && selectedDate) {
      const bDate = new Date(booking.rawStartTime);
      const isSameDate = 
        bDate.getFullYear() === selectedDate.getFullYear() &&
        bDate.getMonth() === selectedDate.getMonth() &&
        bDate.getDate() === selectedDate.getDate();
        
      if (isSameDate) {
        const [slotHours, slotMinutes] = slot.start.split(':').map(Number);
        if (bDate.getHours() === slotHours && bDate.getMinutes() === slotMinutes) {
          isCurrentSlot = true;
        }
      }
    }
    
    return (
      <TouchableOpacity
        key={`${period}-${index}`}
        style={[
          styles.timeSlotCard,
          isSelected && [styles.timeSlotCardSelected, { borderColor: periodColor }],
          isCurrentSlot && styles.timeSlotCardDisabled
        ]}
        onPress={() => setSelectedSlot(slot)}
        activeOpacity={0.7}
        disabled={isCurrentSlot}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeContainer}>
            <Text style={[
              styles.timeText,
              isSelected && [styles.timeTextSelected, { color: periodColor }]
            ]}>
              {formatCompactTime(slot.start)}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            {isCurrentSlot ? (
              <Text style={[styles.durationText, { color: '#94A3B8', fontWeight: 'bold' }]}>Current</Text>
            ) : isSelected ? (
              <View style={[styles.selectedIndicator, { backgroundColor: periodColor }]}>
                <Feather name="check" size={8} color="#FFFFFF" />
              </View>
            ) : (
              <Text style={[styles.durationText, { color: periodColor }]}>
                {/* Fallback to just empty if duration isn't clear, or show end time */}
                {formatCompactTime(slot.end)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPeriodSection = (period, periodSlots) => {
    if (periodSlots.length === 0) return null;
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
              {periodSlots.length}
            </Text>
          </View>
        </View>
        
        <View style={styles.timeSlotsGrid}>
          {periodSlots.map((slot, index) => renderTimeSlot(slot, period, index))}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Feather name="calendar" size={18} color="#5C9CFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Reschedule Booking</Text>
              <Text style={styles.headerSubtitle}>
                {booking?.barberDetails?.name ? `With ${booking.barberDetails.name} • ` : ''}Select a new time
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonIcon}>
             <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.currentBookingContainer}>
            <Text style={styles.sectionLabel}>Current Booking</Text>
            <View style={styles.currentBookingCard}>
              <View style={styles.currentBookingRow}>
                <Feather name="scissors" size={16} color={COLORS.textSecondary} style={styles.currentBookingIcon} />
                <Text style={styles.currentBookingText}>
                  Barber: <Text style={styles.currentBookingBold}>{booking?.barberDetails?.name || 'Staff'}</Text>
                </Text>
              </View>
              <View style={styles.currentBookingRow}>
                <Feather name="clock" size={16} color={COLORS.textSecondary} style={styles.currentBookingIcon} />
                <Text style={styles.currentBookingText}>
                  Time: <Text style={styles.currentBookingBold}>{booking?.formattedDate} • {booking?.timeStart} - {booking?.timeEnd}</Text>
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.dateSelectorContainer}>
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity 
              style={styles.dateSelectorBox}
              onPress={() => setCalendarVisibility(true)}
            >
              <View style={styles.dateSelectorLeft}>
                <Feather name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.dateSelectorText}>{formatDateToDisplay(selectedDate)}</Text>
              </View>
              <Feather name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.reasonContainer}>
             <Text style={styles.sectionLabel}>Reason (optional)</Text>
             <TextInput
               placeholder="Why are you rescheduling?"
               value={reason}
               onChangeText={setReason}
               style={styles.input}
             />
          </View>

          <View style={styles.timeSlotsContainer}>
             <View style={styles.timeSlotsHeader}>
               <Text style={styles.sectionLabel}>Available Times</Text>
               {!loadingSlots && slots.length > 0 && (
                 <Text style={styles.slotsAvailableText}>{slots.length} slots</Text>
               )}
             </View>

             {loadingSlots ? (
                <Text style={styles.loadingText}>Loading availability...</Text>
             ) : (
                <View>
                  {renderPeriodSection('morning', groupedSlots.morning)}
                  {renderPeriodSection('afternoon', groupedSlots.afternoon)}
                  {renderPeriodSection('evening', groupedSlots.evening)}
                  
                  {slots.length === 0 && (
                    <View style={styles.emptyState}>
                      <Feather name="clock" size={28} color="#C7C7CC" />
                      <Text style={styles.emptyTitle}>No slots available</Text>
                      <Text style={styles.emptySubtitle}>Please select another date</Text>
                    </View>
                  )}
                </View>
             )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, !selectedSlot && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={!selectedSlot}
          >
            <Text style={styles.submitButtonText}>Send Reschedule Request</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      <ManualCalendar 
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        isVisible={isCalendarVisible}
        onClose={() => setCalendarVisibility(false)}
      />

    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#1877F215',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  closeButtonIcon: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  currentBookingContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  currentBookingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentBookingIcon: {
    marginRight: 8,
  },
  currentBookingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  currentBookingBold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  dateSelectorContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 16,
  },
  dateSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
  },
  reasonContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    fontSize: 15,
    color: COLORS.text,
  },
  timeSlotsContainer: {
    paddingHorizontal: 16,
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotsAvailableText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  periodSection: {
    marginBottom: 16,
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
    borderColor: COLORS.border,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotCardSelected: {
    backgroundColor: '#F0F5FF',
    borderWidth: 1.5,
  },
  timeSlotCardDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.6,
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
    color: COLORS.text,
    textAlign: 'center',
  },
  timeTextSelected: {
    fontWeight: '800',
  },
  statusContainer: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 20,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7', // Light green
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
