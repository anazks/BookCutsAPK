import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  StyleSheet,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_WIDTH = SCREEN_WIDTH * 3;
const TIMELINE_HEIGHT = 80;

const BarberScheduleTimeline = ({
  scheduleData = {
    workHours: { from: "09:00", to: "17:00" },
    breaks: [],
    bookings: [],
    freeSlots: []
  },
  totalDuration = 60,
  onTimeSelect,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(totalDuration);
  const [dragPosition, setDragPosition] = useState(null);
  const scrollViewRef = useRef(null);
  const lastValidPosition = useRef(null);

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startMin = timeToMinutes(scheduleData?.workHours?.from || "09:00");
  const endMin = timeToMinutes(scheduleData?.workHours?.to || "17:00");
  const totalMinutes = endMin - startMin;

  const getPosition = (time) => {
    const min = timeToMinutes(time);
    return ((min - startMin) / totalMinutes) * TIMELINE_WIDTH;
  };

  const getPositionFromMinutes = (min) => {
    return ((min - startMin) / totalMinutes) * TIMELINE_WIDTH;
  };

  const generateTimeMarkers = () => {
    const markers = [];
    for (let min = startMin; min <= endMin; min += 30) {
      markers.push({
        time: minutesToTime(min),
        position: getPositionFromMinutes(min)
      });
    }
    return markers;
  };

  const isValidPlacement = (startMinutes, duration) => {
    const endMinutes = startMinutes + duration;
    
    if (startMinutes < startMin || endMinutes > endMin) return false;
    
    for (const booking of scheduleData.bookings || []) {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      if (!(endMinutes <= bookingStart || startMinutes >= bookingEnd)) {
        return false;
      }
    }
    
    for (const breakTime of scheduleData.breaks || []) {
      const breakStart = timeToMinutes(breakTime.startTime);
      const breakEnd = timeToMinutes(breakTime.endTime);
      if (!(endMinutes <= breakStart || startMinutes >= breakEnd)) {
        return false;
      }
    }
    
    return true;
  };

  const findNearestValidPosition = (targetMinutes, duration) => {
    // Try exact position first
    if (isValidPlacement(targetMinutes, duration)) {
      return targetMinutes;
    }

    // Search nearby positions (within 30 minutes)
    for (let offset = 5; offset <= 30; offset += 5) {
      // Try forward
      const forward = targetMinutes + offset;
      if (forward + duration <= endMin && isValidPlacement(forward, duration)) {
        return forward;
      }
      
      // Try backward
      const backward = targetMinutes - offset;
      if (backward >= startMin && isValidPlacement(backward, duration)) {
        return backward;
      }
    }

    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateDragPosition(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateDragPosition(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        if (dragPosition && onTimeSelect) {
          onTimeSelect({
            startTime: minutesToTime(dragPosition),
            endTime: minutesToTime(dragPosition + selectedDuration),
            duration: selectedDuration,
            startMinutes: dragPosition,
            endMinutes: dragPosition + selectedDuration,
          });
        }
      },
    })
  ).current;

  const updateDragPosition = (x) => {
    const percentage = Math.max(0, Math.min(100, (x / TIMELINE_WIDTH) * 100));
    const minutes = startMin + (percentage / 100) * totalMinutes;
    const roundedMinutes = Math.round(minutes / 5) * 5; // Round to 5-minute intervals for smoother dragging
    
    const validPosition = findNearestValidPosition(roundedMinutes, selectedDuration);
    
    if (validPosition !== null) {
      setDragPosition(validPosition);
      lastValidPosition.current = validPosition;
    } else if (lastValidPosition.current !== null) {
      // Keep showing last valid position while dragging over invalid areas
      setDragPosition(lastValidPosition.current);
    }
  };

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
    // Revalidate current position with new duration
    if (dragPosition) {
      const validPosition = findNearestValidPosition(dragPosition, duration);
      if (validPosition !== null) {
        setDragPosition(validPosition);
        lastValidPosition.current = validPosition;
      } else {
        setDragPosition(null);
        lastValidPosition.current = null;
      }
    }
  };

  // Update selectedDuration when totalDuration prop changes
  React.useEffect(() => {
    setSelectedDuration(totalDuration);
    if (dragPosition) {
      const validPosition = findNearestValidPosition(dragPosition, totalDuration);
      if (validPosition !== null) {
        setDragPosition(validPosition);
        lastValidPosition.current = validPosition;
      } else {
        setDragPosition(null);
        lastValidPosition.current = null;
      }
    }
  }, [totalDuration]);

  const timeMarkers = generateTimeMarkers();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineTitleContainer}>
            <Text style={styles.timelineIcon}>🕐</Text>
            <Text style={styles.timelineTitle}>Available Time Slots</Text>
          </View>

          <Text style={styles.instructionText}>
            Drag on the timeline to select your preferred time ({selectedDuration} min)
          </Text>

          {/* Time Markers - Scrollable */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.timelineScrollView}
            persistentScrollbar={true}
          >
            <View style={styles.timelineWrapper}>
              {/* Time Labels */}
              <View style={styles.timeMarkers}>
                {timeMarkers.map((marker, idx) => (
                  <Text
                    key={idx}
                    style={[styles.timeMarker, { left: marker.position }]}
                  >
                    {marker.time}
                  </Text>
                ))}
              </View>

              {/* Timeline Bar */}
              <View
                style={styles.timeline}
                {...panResponder.panHandlers}
              >
                {/* Time Grid Lines */}
                {timeMarkers.map((marker, idx) => (
                  <View
                    key={idx}
                    style={[styles.gridLine, { left: marker.position }]}
                  />
                ))}

                {/* Booked Slots */}
                {(scheduleData.bookings || []).map((booking, idx) => (
                  <View
                    key={`booking-${idx}`}
                    style={[
                      styles.timeSlot,
                      styles.bookedSlot,
                      {
                        left: getPosition(booking.startTime),
                        width: getPosition(booking.endTime) - getPosition(booking.startTime)
                      }
                    ]}
                  >
                    <Text style={styles.slotText}>Booked</Text>
                  </View>
                ))}

                {/* Free Slots */}
                {(scheduleData.freeSlots || []).map((slot, idx) => (
                  <View
                    key={`free-${idx}`}
                    style={[
                      styles.timeSlot,
                      styles.freeSlot,
                      {
                        left: getPosition(slot.from),
                        width: getPosition(slot.to) - getPosition(slot.from)
                      }
                    ]}
                  />
                ))}

                {/* Break Slots */}
                {(scheduleData.breaks || []).map((breakTime, idx) => (
                  <View
                    key={`break-${idx}`}
                    style={[
                      styles.timeSlot,
                      styles.breakSlot,
                      {
                        left: getPosition(breakTime.startTime),
                        width: getPosition(breakTime.endTime) - getPosition(breakTime.startTime)
                      }
                    ]}
                  >
                    <Text style={styles.slotText}>Break</Text>
                  </View>
                ))}

                {/* User Selection */}
                {dragPosition && (
                  <View
                    style={[
                      styles.timeSlot,
                      styles.selectedSlot,
                      {
                        left: getPositionFromMinutes(dragPosition),
                        width: (selectedDuration / totalMinutes) * TIMELINE_WIDTH
                      }
                    ]}
                  >
                    <Text style={styles.selectedSlotText}>
                      {minutesToTime(dragPosition)}
                    </Text>
                    <Text style={styles.selectedSlotDuration}>
                      {selectedDuration} min
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.freeSlot]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.bookedSlot]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.breakSlot]} />
              <Text style={styles.legendText}>Break</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.selectedSlot]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>
        </View>

        {/* Selected Time Display */}
        {dragPosition && (
          <View style={styles.selectedTimeCard}>
            <Text style={styles.selectedTimeLabel}>Selected Time Slot</Text>
            <Text style={styles.selectedTimeValue}>
              {minutesToTime(dragPosition)} - {minutesToTime(dragPosition + selectedDuration)}
            </Text>
            <Text style={styles.selectedTimeDuration}>
              Duration: {selectedDuration} minutes
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
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  durationContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#2563EB',
    transform: [{ scale: 1.05 }],
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
  },
  timelineSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  timelineTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  timelineScrollView: {
    marginBottom: 16,
  },
  timelineWrapper: {
    width: TIMELINE_WIDTH,
    height: TIMELINE_HEIGHT + 30,
  },
  timeMarkers: {
    height: 20,
    position: 'relative',
    marginBottom: 8,
  },
  timeMarker: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    transform: [{ translateX: -20 }],
  },
  timeline: {
    height: TIMELINE_HEIGHT,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D1D5DB',
  },
  timeSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  freeSlot: {
    backgroundColor: '#A7F3D0',
    borderColor: '#6EE7B7',
  },
  bookedSlot: {
    backgroundColor: '#FCA5A5',
    borderColor: '#F87171',
  },
  breakSlot: {
    backgroundColor: '#FCD34D',
    borderColor: '#FBBF24',
  },
  selectedSlot: {
    backgroundColor: '#3B82F6',
    borderColor: '#1D4ED8',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedSlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedSlotDuration: {
    fontSize: 9,
    color: '#DBEAFE',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
  selectedTimeCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedTimeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  selectedTimeDuration: {
    fontSize: 14,
    color: '#3B82F6',
  },
});

export default BarberScheduleTimeline;

// Example Usage:
/*
<BarberScheduleTimeline
  scheduleData={{
    workHours: { from: "09:00", to: "17:00" },
    breaks: [{ startTime: "12:00", endTime: "12:30" }],
    bookings: [{ startTime: "09:00", endTime: "11:00", status: "confirmed" }],
    freeSlots: [
      { from: "11:00", to: "12:00", minutes: 60 },
      { from: "12:30", to: "17:00", minutes: 270 }
    ]
  }}
  totalDuration={60}
  onTimeSelect={(selectedTime) => {
    console.log('Selected:', selectedTime);
    // Handle the selected time
  }}
/>
*/