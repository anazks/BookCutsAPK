import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,useWindowDimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, runOnJS, runOnUI,withTiming } from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { SlotBooking } from '../../api/Service/Booking';
import { getmyBarbers, getShopById, getShopServices } from '../../api/Service/Shop';
import { getBarberFreeTime } from '../../api/Service/Booking';
import { useDerivedValue } from 'react-native-reanimated';
import BarberScheduleTimeline from './BarberScheduleTimeLine';
// import Timeline from './Timeline';

const parseTime = (timeStr) => {
  timeStr = timeStr.trim().toLowerCase(); 
  const match = timeStr.match(/(\d+)([ap]m)/);

  if (!match) return '09:00';

  let hour = parseInt(match[1], 10);
  const modifier = match[2];

  if (modifier === 'pm' && hour !== 12) {
    hour += 12;
  } else if (modifier === 'am' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:00`;
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const addMinutesToTime = (timeStr, minutesToAdd) => {
  const totalMin = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMin);
};

// Old/Good Manual Calendar Component (Replaced the enhanced new one with this version for better usability)
const ManualCalendar = ({ selectedDate, onDateSelect, isVisible, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push({
        day,
        date,
        isToday,
        isPast,
        isSelected
      });
    }
    
    return days;
  };
  
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };
  
  const handleDateSelect = (dayObj) => {
    if (!dayObj || dayObj.isPast) return;
    onDateSelect(dayObj.date);
    onClose();
  };
  
  const calendarDays = generateCalendarDays();
  const today = new Date();
  const canGoPrev = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());
  
  if (!isVisible) return null;
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={calendarStyles.modalOverlay}>
        <View style={calendarStyles.calendarContainer}>
          {/* Calendar Header */}
          <View style={calendarStyles.calendarHeader}>
            <TouchableOpacity 
              style={[calendarStyles.navButton, !canGoPrev && calendarStyles.disabledNav]}
              onPress={() => canGoPrev && navigateMonth('prev')}
              disabled={!canGoPrev}
            >
              <Text style={calendarStyles.navText}>Previous</Text>
            </TouchableOpacity>
            
            <Text style={calendarStyles.monthYear}>
              {months[currentMonth]} {currentYear}
            </Text>
            
            <TouchableOpacity 
              style={calendarStyles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <Text style={calendarStyles.navText}>Next</Text>
            </TouchableOpacity>
          </View>
          
          {/* Days of Week Header */}
          <View style={calendarStyles.daysHeader}>
            {daysOfWeek.map(day => (
              <Text key={day} style={calendarStyles.dayHeaderText}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={calendarStyles.calendarGrid}>
            {calendarDays.map((dayObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  calendarStyles.dayCell,
                  dayObj?.isToday && calendarStyles.todayCell,
                  dayObj?.isPast && calendarStyles.pastCell,
                  dayObj?.isSelected && calendarStyles.selectedCell,
                ]}
                onPress={() => handleDateSelect(dayObj)}
                disabled={!dayObj || dayObj.isPast}
              >
                <Text style={[
                  calendarStyles.dayText,
                  dayObj?.isToday && calendarStyles.todayText,
                  dayObj?.isPast && calendarStyles.pastText,
                  dayObj?.isSelected && calendarStyles.selectedText,
                ]}>
                  {dayObj?.day || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Calendar Footer */}
          <View style={calendarStyles.calendarFooter}>
            <TouchableOpacity 
              style={calendarStyles.closeButton}
              onPress={onClose}
            >
              <Text style={calendarStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Timeline = ({ freeGaps, totalDuration, openingTime, closingTime, onSlotChange, selectedStartTime }) => {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef(null);
  const openMin = timeToMinutes(openingTime);
  const closeMin = timeToMinutes(closingTime);
  const totalMinutes = closeMin - openMin;
  const scale = 2; // Fixed scale for better visibility and scrollability
  const timelineWidth = totalMinutes * scale;
  const slotWidth = totalDuration * scale;

  const translateX = useSharedValue(0);
  const startTranslate = useSharedValue(0);

  const handleSnap = useCallback((startX, currentX) => {
    const intendedMinAbs = openMin + (currentX / scale);
    // Find target gap for the intended start position
    let targetGap = null;
    for (const gap of freeGaps) {
      const gs = timeToMinutes(gap.from);
      const ge = timeToMinutes(gap.to);
      if (intendedMinAbs >= gs && intendedMinAbs < ge) {
        targetGap = gap;
        break;
      }
    }
    if (!targetGap) {
      runOnUI((sx) => {
        'worklet'
        translateX.value = sx;
      })(startX);
      return;
    }
    // Generate candidates within this gap
    const gs = timeToMinutes(targetGap.from);
    const ge = timeToMinutes(targetGap.to);
    const gapStartPossible = Math.max(gs, Math.ceil(gs / 30) * 30);
    let candidates = [];
    for (let candMinAbs = gapStartPossible; candMinAbs <= ge - totalDuration; candMinAbs += 30) {
      const candTime = minutesToTime(candMinAbs);
      const candRelMin = candMinAbs - openMin;
      const candX = candRelMin * scale;
      const dist = Math.abs(candX - currentX);
      candidates.push({ x: candX, dist, time: candTime });
    }
    if (candidates.length === 0) {
      runOnUI((sx) => {
        'worklet'
        translateX.value = sx;
      })(startX);
      return;
    }
    // Sort by distance and pick closest
    candidates.sort((a, b) => a.dist - b.dist);
    const best = candidates[0];
    onSlotChange(best.time);
    runOnUI((tx) => {
      'worklet'
      translateX.value = tx;
    })(best.x);
  }, [freeGaps, totalDuration, onSlotChange, translateX, openMin, scale, timeToMinutes, minutesToTime]);

  const findAndSetBest = useCallback((intendedMinAbs) => {
    const currentX = (intendedMinAbs - openMin) * scale;
    // Find target gap
    let targetGap = null;
    for (const gap of freeGaps) {
      const gs = timeToMinutes(gap.from);
      const ge = timeToMinutes(gap.to);
      if (intendedMinAbs >= gs && intendedMinAbs < ge) {
        targetGap = gap;
        break;
      }
    }
    if (!targetGap) {
      return; // Do not set if not in a gap
    }
//     // Generate candidates within this gap
    const gs = timeToMinutes(targetGap.from);
    const ge = timeToMinutes(targetGap.to);
    const gapStartPossible = Math.max(gs, Math.ceil(gs / 30) * 30);
    let candidates = [];
    for (let candMinAbs = gapStartPossible; candMinAbs <= ge - totalDuration; candMinAbs += 30) {
      const candTime = minutesToTime(candMinAbs);
      const candRelMin = candMinAbs - openMin;
      const candX = candRelMin * scale;
      const dist = Math.abs(candX - currentX);
      candidates.push({ x: candX, dist, time: candTime });
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.dist - b.dist);
      const best = candidates[0];
      translateX.value = best.x;
      startTranslate.value = best.x;
      onSlotChange(best.time);
    }
  }, [freeGaps, totalDuration, onSlotChange, translateX, startTranslate, openMin, scale, timeToMinutes, minutesToTime]);

  useEffect(() => {
    if (freeGaps.length > 0 && !selectedStartTime) {
      const intendedMinAbs = timeToMinutes(freeGaps[0].from);
      findAndSetBest(intendedMinAbs);
      // Initial scroll to start
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: 0, animated: false });
      }, 100);
    }
  }, [freeGaps, selectedStartTime, findAndSetBest]);

  useEffect(() => {
    if (selectedStartTime) {
      const intendedMinAbs = timeToMinutes(selectedStartTime);
      const selX = (intendedMinAbs - openMin) * scale;
      // Try to snap within gap, fallback to exact
      let targetGap = null;
      for (const gap of freeGaps) {
        const gs = timeToMinutes(gap.from);
        const ge = timeToMinutes(gap.to);
        if (intendedMinAbs >= gs && intendedMinAbs < ge) {
          targetGap = gap;
          break;
        }
      }
      if (targetGap) {
        findAndSetBest(intendedMinAbs);
      } else {
        translateX.value = selX;
        startTranslate.value = selX;
      }
//       // Scroll to center the selected slot
      setTimeout(() => {
        const scrollX = Math.max(0, selX - screenWidth / 2);
        scrollRef.current?.scrollTo({ x: scrollX, animated: true });
      }, 100);
    }
  }, [selectedStartTime, findAndSetBest, screenWidth, scale, openMin]);

  const gestureHandler = useAnimatedGestureHandler(
    {
      onStart: (event) => {
        'worklet'
        startTranslate.value = translateX.value;
      },
      onActive: (event) => {
        'worklet'
        translateX.value = startTranslate.value + event.translationX;
      },
      onEnd: (event) => {
        'worklet'
        runOnJS(handleSnap)(startTranslate.value, translateX.value);
      },
    },
    [handleSnap, startTranslate, translateX]
  );

  const animStyle = useAnimatedStyle(() => {
    'worklet'
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

//   // Tick and label interval: every 30 minutes
  const intervalMinutes = 30;
  const labelWidth = 35;

//   // Generate ticks every intervalMinutes
  const tickElements = [];
  let currentTickTime = Math.ceil(openMin / intervalMinutes) * intervalMinutes;
  while (currentTickTime <= closeMin) {
    const left = (currentTickTime - openMin) * scale;
    const isMajorTick = currentTickTime % 60 === 0;
    if (left <= timelineWidth) {
      tickElements.push(
        <View
          key={`${currentTickTime}-tick`}
          style={{
            position: 'absolute',
            left,
            top: 20,
            width: 1,
            height: isMajorTick ? 60 : 20,
            backgroundColor: isMajorTick ? '#94A3B8' : '#E2E8F0',
          }}
        />
      );
     }
    currentTickTime += intervalMinutes;
  }

//   // Generate labels every intervalMinutes, with emphasis on full hours
  const labelElements = [];
  currentTickTime = Math.ceil(openMin / intervalMinutes) * intervalMinutes; // Reuse for labels
  while (currentTickTime <= closeMin) {
    const left = (currentTickTime - openMin) * scale;
    const timeLabel = minutesToTime(currentTickTime);
    const isHour = currentTickTime % 60 === 0;

    let labelLeft = left - labelWidth / 2;
    if (labelLeft < 0) {
      labelLeft = 0;
    } else if (labelLeft + labelWidth > timelineWidth) {
      labelLeft = timelineWidth - labelWidth;
    }

    if (left <= timelineWidth + labelWidth) { // Ensure end labels show
      labelElements.push(
        <Text
          key={`${currentTickTime}-label`}
          style={{
            position: 'absolute',
            left: labelLeft,
            top: 4,
            color: isHour ? '#475569' : '#94A3B8', // Darker for hours
            fontSize: 11, // Slightly smaller to prevent overlap
            fontWeight: isHour ? 'bold' : 'normal',
            width: labelWidth,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {timeLabel}
        </Text>
      );
    }
    currentTickTime += intervalMinutes;
  }

  // Always ensure start and end labels if not already included
  const startTimeMin = openMin;
  let startLabelLeft = (startTimeMin - openMin) * scale - labelWidth / 2;
  if (startLabelLeft < 0) {
    startLabelLeft = 0;
  } else if (startLabelLeft + labelWidth > timelineWidth) {
    startLabelLeft = timelineWidth - labelWidth;
  }
  const hasStartLabel = labelElements.some(el => el.key === `${startTimeMin}-label`);
  if (!hasStartLabel) {
    labelElements.unshift(
      <Text
        key={`${startTimeMin}-start-label`}
        style={{
          position: 'absolute',
          left: startLabelLeft,
          top: 4,
          color: '#475569',
          fontSize: 11,
          fontWeight: 'bold',
          width: labelWidth,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {openingTime}
      </Text>
    );
  }

  const endTimeMin = closeMin;
  let endLabelLeft = (endTimeMin - openMin) * scale - labelWidth / 2;
  if (endLabelLeft < 0) {
    endLabelLeft = 0;
  } else if (endLabelLeft + labelWidth > timelineWidth) {
    endLabelLeft = timelineWidth - labelWidth;
  }
  const hasEndLabel = labelElements.some(el => el.key === `${endTimeMin}-label`);
  if (!hasEndLabel) {
    labelElements.push(
      <Text
        key={`${endTimeMin}-end-label`}
        style={{
          position: 'absolute',
          left: endLabelLeft,
          top: 4,
          color: '#475569',
          fontSize: 11,
          fontWeight: 'bold',
          width: labelWidth,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {closingTime}
      </Text>
    );
  }

  // Slot time text
  const slotTimeText = selectedStartTime
    ? `${selectedStartTime} - ${addMinutesToTime(selectedStartTime, totalDuration)}`
    : `${openingTime} - ${addMinutesToTime(openingTime, totalDuration)}`;

  return (
    <View style={{ height: 100, width: '100%', position: 'relative', marginTop: 16 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: timelineWidth }}
        style={{ height: 80 }}
        bounces
        decelerationRate="normal"
      >
        <View style={{ width: timelineWidth, height: 80, position: 'relative', backgroundColor: '#f8fafc' }}>
          {/* Ruler strip background */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              backgroundColor: '#f1f5f9',
              borderBottomWidth: 1,
              borderBottomColor: '#e2e8f0',
              zIndex: 5,
            }}
          />

          {/* Time labels (ruler-like above the bar) */}
          {labelElements}

          {/* Ticks */}
          {tickElements}

          {/* Free gaps */}
          {freeGaps.map((gap, index) => {
            const left = (timeToMinutes(gap.from) - openMin) * scale;
            const gapWidth = (timeToMinutes(gap.to) - timeToMinutes(gap.from)) * scale;
            return (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  top: 20,
                  left,
                  width: gapWidth,
                  height: 60,
                  backgroundColor: 'rgba(16, 185, 129, 0.3)',
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.5)',
                }}
              >
                <Text
                  style={{
                    position: 'absolute',
                    top: 25,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: '#059669',
                    fontSize: 10,
                    fontWeight: '500',
                  }}
                  numberOfLines={1}
                >
                  {`${gap.from} - ${gap.to}`}
                </Text>
              </View>
            );
          })}

           {/* Draggable slot */}
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View
              style={[
                animStyle,
                {
                  position: 'absolute',
                  top: 30,
                  left: 0,
                  width: slotWidth,
                  height: 40,
                  backgroundColor: '#FF6B6B',
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  elevation: 3,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {slotTimeText}
              </Text>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </ScrollView>

       {/* Legend */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
          Green = Free Slots | Red = Your {totalDuration}min Appointment
        </Text>
      </View>
    </View>
  );
};

export default function BookNow() {
  const { shop_id } = useLocalSearchParams();
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [isCalendarVisible, setCalendarVisibility] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [apiErrors, setApiErrors] = useState({ services: false, barbers: false });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const scrollViewRef = useRef(null);
const [dynamicOpeningTime, setDynamicOpeningTime] = useState<string>('09:00');
const [dynamicClosingTime, setDynamicClosingTime] = useState<string>('21:00');
  const [freeGaps, setFreeGaps] = useState<any>({
  workHours: { from: "09:00", to: "21:00" },
  breaks: [],
  bookings: [],
  freeSlots: []
});

  // Fetch barber free time using imported function

const fetchFreeTimes = useCallback(async () => {
  if (!selectedDate || !selectedBarber?.id) {
    setFreeGaps([]);
    setSelectedStartTime(null);
    return;
  }

  const dateStr = selectedDate.toLocaleDateString('en-CA') 

  try {
    const response = await getBarberFreeTime(selectedBarber.id, dateStr,shop_id);
    console.log("Barber free time response:", response);

    if (response?.success && response?.availableHours?.success) {
      const apiSchedule = response.availableHours.schedule;

      // Build the exact schedule object your new Timeline expects
      const schedule = {
        workHours: {
          from: apiSchedule.workHours?.from || "09:00",
          to: apiSchedule.workHours?.to || "21:00"
        },
        breaks: (apiSchedule.breaks || []).map(b => ({
          startTime: b.startTime,
          endTime: b.endTime
        })),
        bookings: (apiSchedule.bookings || [])
          .filter(b => b.bookingStatus === "confirmed" || b.status === "confirmed") // safety
          .map(b => ({
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.bookingStatus || b.status || "confirmed"
          })),
        freeSlots: (apiSchedule.freeSlots || []).map(slot => ({
          from: slot.from,
          to: slot.to,
          minutes: slot.minutes || timeToMinutes(slot.to) - timeToMinutes(slot.from)
        }))
      };

      // Pass the full schedule object instead of just gaps
      setFreeGaps(schedule); // Now storing the whole schedule

      // Auto-select first free slot
      if (schedule.freeSlots.length > 0 && !selectedStartTime) {
        setSelectedStartTime(schedule.freeSlots[0].from);
      } else if (schedule.freeSlots.length === 0) {
        setSelectedStartTime(null);
      }

      // Optional: store opening/closing for other uses
      setDynamicOpeningTime(schedule.workHours.from);
      setDynamicClosingTime(schedule.workHours.to);
    } else {
      setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
      setSelectedStartTime(null);
    }
  } catch (err) {
    console.error('Error fetching barber schedule:', err);
    setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
    setSelectedStartTime(null);
  }
}, [selectedDate, selectedBarber?.id, selectedStartTime]);

  useEffect(() => {
    fetchFreeTimes();
  }, [fetchFreeTimes]);

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);
        setApiErrors({ services: false, barbers: false });

        const shopResponse = await getShopById(shop_id);
        if (!shopResponse?.success) throw new Error(shopResponse?.message || "Failed to load shop");

        const shopData = shopResponse.data?.[0];
        if (!shopData) throw new Error("No shop data available");

        const times = (shopData.Timing || '').split('-').map(t => t.trim()).filter(Boolean) || [];
        const openingTime = times.length > 0 ? parseTime(times[0]) : '09:00';
        const closingTime = times.length > 1 ? parseTime(times[1]) : '21:00';

        // Fetch services and barbers
        let services = [];
        let barbers = [];
        let servicesError = false;
        let barbersError = false;

        try {
          const servicesResponse = await getShopServices(shop_id);
          if (servicesResponse?.success) {
            services = servicesResponse.data.map(service => ({
              id: service._id,
              name: service.ServiceName,
              price: parseInt(service.Rate, 10) || 0,
              duration: 30
            }));
          } else servicesError = true;
        } catch (e) {
          servicesError = true;
          console.error("Error fetching services:", e);
        }

        try {
          const barbersResponse = await getmyBarbers(shop_id);
          if (barbersResponse?.success) {
            barbers = barbersResponse.data.map(barber => ({
              id: barber._id,
              name: barber.BarberName,
              nativePlace: barber.From
            }));
          } else barbersError = true;
        } catch (e) {
          barbersError = true;
          console.error("Error fetching barbers:", e);
        }

        setApiErrors({ services: servicesError, barbers: barbersError });
        setShopDetails({
          id: shopData._id,
          name: shopData.ShopName,
          address: `${shopData.City || ''} • ${shopData.Mobile || ''}`,
          openingTime,
          closingTime,
          services,
          barbers,
          Timing: shopData.Timing
        });

      } catch (error) {
        setError(error.message || "Failed to load shop details");
      } finally {
        setLoading(false);
      }
    };

    if (shop_id) {
      fetchShopData();
    } else {
      setError('No shop ID provided');
      setLoading(false);
    }
  }, [shop_id]);

  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration || 30), 0);

  const toggleService = (service) => {
    setSelectedServices(prevServices => {
      if (prevServices.some(s => s.id === service.id)) {
        return prevServices.filter(s => s.id !== service.id);
      } else {
        return [...prevServices, service];
      }
    });
  };

  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber);
    if (barber.id && selectedDate) {
      fetchFreeTimes();
    } else {
      setFreeGaps([]);
      setSelectedStartTime(null);
    }
  };

  const validateBooking = () => {
    if (selectedServices.length === 0) return "Please select at least one service";
    if (!selectedDate) return "Please select a date";
    if (!selectedBarber) return "Please select a barber";
    if (!selectedBarber.id) return "Please select a specific barber";
    if (!selectedStartTime) return "Please select a time slot";
    return null;
  };

const prepareBookingData = () => {
  const bookingDateStr = selectedDate?.toISOString()?.split('T')[0] || '';
  if (!bookingDateStr) {
    throw new Error("Invalid booking date");
  }
  const startTimeStr = selectedStartTime || '';
  if (!startTimeStr) {
    throw new Error("Invalid start time");
  }
  const endTimeStr = addMinutesToTime(startTimeStr, totalDuration);
  const startingTime = new Date(`${bookingDateStr}T${startTimeStr}:00`).toISOString();
  const endingTime = new Date(`${bookingDateStr}T${endTimeStr}:00`).toISOString();

  const getValidId = (id) => {
    if (id == null || (Array.isArray(id) && id.length === 0)) {
      return null;
    }
    return id;
  };

  const serviceIdsTemp = selectedServices
    .map(s => {
      const id = getValidId(s.id);
      if (id == null) return null;
      return Array.isArray(id) ? id : [id];
    })
    .filter(arr => arr != null)
    .flat();

  // Calculate advance payment (e.g., min 20% or fixed min 20 as per existing alert logic)
  const advanceAmount = Math.min(20, totalPrice * 0.2); // Or Math.min(20, totalPrice) to match alert
  const remainingAmount = totalPrice - advanceAmount;

  return {
    barberId: getValidId(selectedBarber?.id),
    userId: "69315678fca89f6d95026e4a", // Replace with actual user ID from auth context/state
    shopId: shopDetails?.id || null,
    serviceIds: serviceIdsTemp.length > 0 ? serviceIdsTemp : null,
    services: selectedServices?.length
      ? selectedServices.map(service => ({
          id: getValidId(service.id),
          name: service.name || 'Unknown Service',
          price: service.price || 0,
          duration: service.duration || 30
        })).filter(service => service.id !== null || selectedServices.length === 1)
      : [], // Empty array if no services, or adjust as needed
    bookingDate: bookingDateStr,
    timeSlot: {
      startingTime,
      endingTime
    },
    totalPrice: totalPrice || 0,
    totalDuration: totalDuration || 30,
    paymentType: 'advance',
    amountToPay: advanceAmount,
    remainingAmount,
    currency: 'INR',
    bookingStatus: 'pending',
    paymentId: null, // Set after payment (e.g., from PayNow response)
    paymentStatus: 'unpaid', // Initial status; update to 'partial' after advance payment
    amountPaid: 0 // Initial; update after payment
  };
};

  const handleBookNow = () => {
    const validationError = validateBooking();
    if (validationError) return Alert.alert("Incomplete Booking", validationError);
    setShowConfirmation(true);
  };

  const confirmBooking = async () => {
    setShowConfirmation(false);
    setIsBooking(true);
    
    try {
      const bookingData = prepareBookingData();
      console.log("Submitting booking:\n", JSON.stringify(bookingData, null, 2));

      
      const response = await SlotBooking(bookingData);
      console.log("..........................",response,"-------------------------------------------------------------------------------------------------------")
      if (response.success) {
        const bookingId = response.BookingStatus?._id;
        console.log(bookingId,"<><><><><><><><><><><><><><><><><><><><>")
        const endTimeStr = addMinutesToTime(selectedStartTime, totalDuration);
        Alert.alert(
          "Booking Confirmed", 
          `Your appointment with ${selectedBarber.name} is confirmed for ${selectedDate.toDateString()} at ${selectedStartTime} - ${endTimeStr}`,
          [{ 
            text: "Continue to Payment", 
            onPress: () => {
              router.push({
                pathname: '/Screens/User/PayNow',
                params: {
                  bookingData: JSON.stringify(bookingData),
                  bookingId: bookingId,
                  advanceAmount: Math.min(20, totalPrice),
                  totalPrice,
                  barberName: selectedBarber?.name,
                  bookingDate: selectedDate?.toLocaleDateString(),
                  timeSlot: `${selectedStartTime} - ${endTimeStr}`
                }
              });
            }
          }]
        );
        
        // Reset form
        setSelectedBarber(null);
        setSelectedServices([]);
        setSelectedDate(null);
        setSelectedStartTime(null);
        setFreeGaps([]);
      } else {
        throw new Error(response.message || "Booking failed");
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        "Booking Error", 
        error.message || "Failed to complete booking. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
  };

  const getProgressSteps = () => {
    let completed = 0;
    if (selectedServices.length > 0) completed++;
    if (selectedDate) completed++;
    if (selectedBarber && selectedStartTime) completed++;
    return { completed, total: 3 };
  };

  const allServices = shopDetails?.services ? [
    { id: null, name: 'hair cut', price: 150, duration: 30 },
    ...shopDetails.services
  ] : [];

  const barberOptions = shopDetails?.barbers ? [
    { id: null, name: 'Any Barber', nativePlace: 'Available' },
    ...shopDetails.barbers
  ] : [{ id: null, name: 'Any Barber', nativePlace: 'Available' }];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !shopDetails) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Failed to load shop details"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const progress = getProgressSteps();

  return (
    <SafeAreaView style={styles.container}>
      {/* Manual Calendar (Old/Good Version) */}
      <ManualCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        isVisible={isCalendarVisible}
        onClose={() => setCalendarVisibility(false)}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
              <Text style={styles.modalTitle}>Confirm Your Booking</Text>
              <Text style={styles.modalSubtitle}>Please review your appointment details</Text>
            </View>
            
            <View style={styles.bookingSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Services</Text>
                <Text style={styles.summaryValue}>{selectedServices.map(s => s.name).join(', ')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{selectedDate?.toDateString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Barber</Text>
                <Text style={styles.summaryValue}>{selectedBarber?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{selectedStartTime} - {addMinutesToTime(selectedStartTime || '00:00', totalDuration)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{totalDuration} minutes</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalPrice}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmBooking}
                disabled={isBooking}
              >
                <Text style={styles.confirmButtonText}>
                  {isBooking ? 'Processing...' : 'Confirm Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{shopDetails.name}</Text>
          <Text style={styles.shopAddress}>{shopDetails.address}</Text>
          <View style={styles.timingBadge}>
            <Ionicons name="time-outline" size={14} color="#FFFFFF" style={styles.timingIcon} />
            <Text style={styles.timingText}>Open {shopDetails.Timing || `${shopDetails.openingTime} - ${shopDetails.closingTime}`}</Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(progress.completed / progress.total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {progress.completed} of {progress.total}</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Services Selection - First Section */}
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cut-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Select Services</Text>
          </View>
          <View style={styles.servicesGrid}>
            {allServices.map((service, index) => (
              <TouchableOpacity
                key={service.id || `default-service-${index}`}
                style={[
                  styles.serviceCard,
                  selectedServices.some(s => s.id === service.id) && styles.selectedServiceCard
                ]}
                onPress={() => toggleService(service)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.serviceIconContainer,
                  selectedServices.some(s => s.id === service.id) && styles.selectedServiceIconContainer
                ]}>
                  <Ionicons name="cut" size={24} color={selectedServices.some(s => s.id === service.id) ? "#FFFFFF" : "#64748B"} />
                </View>
                <Text style={styles.serviceTitle} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
                {selectedServices.some(s => s.id === service.id) && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.serviceCheckIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {apiErrors.services && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Unable to load services</Text>
            </View>
          )}
          {allServices.length === 0 && !apiErrors.services && (
            <Text style={styles.emptyStateText}>No services available</Text>
          )}
        </View>

        {selectedServices.length > 0 && (
          <View style={styles.selectionSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Duration</Text>
              <Text style={styles.summaryValue}>{totalDuration} minutes</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Cost</Text>
              <Text style={styles.summaryPrice}>₹{totalPrice}</Text>
            </View>
          </View>
        )}

        {/* Date Selection - Second Section */}
        <View style={[styles.sectionCard, selectedDate && styles.completedCard]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>

          <TouchableOpacity
            style={[styles.dateTimeSelector, selectedDate && styles.selectedDateSelector]}
            onPress={() => setCalendarVisibility(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
            <Text style={selectedDate ? styles.selectedDateText : styles.placeholderText}>
              {selectedDate ? selectedDate.toDateString() : "Select Date"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Barber & Time Selection - Third Section */}
        <View style={[styles.sectionContent, (selectedBarber && selectedStartTime) && styles.completedCard]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Select Barber & Time</Text>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.barbersScrollContent}
          >
            <View style={styles.barbersGrid}>
              {barberOptions.map(barber => (
                <TouchableOpacity
                  key={barber.id || 'default-barber'}
                  style={[
                    styles.barberCard,
                    selectedBarber?.id === barber.id && styles.selectedBarberCard
                  ]}
                  onPress={() => handleBarberSelect(barber)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.barberCircle,
                    selectedBarber?.id === barber.id && styles.selectedBarberCircle
                  ]}>
                    <Text style={[
                      styles.barberInitial,
                      selectedBarber?.id === barber.id && styles.selectedBarberInitial
                    ]}>
                      {barber.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.barberTextContainer}>
                    <Text style={styles.barberName} numberOfLines={1}>{barber.name}</Text>
                    {barber.id !== null && (
                      <Text style={styles.barberMeta} numberOfLines={1}>
                        {barber.nativePlace}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {selectedBarber && !selectedBarber.id && (
            <Text style={styles.noteText}>Select a specific barber to choose time slot</Text>
          )}

          {selectedBarber?.id && selectedDate && freeGaps.length === 0 && selectedStartTime === null && (
            <Text style={styles.loadingText}>Loading availability...</Text>
          )}

          {freeGaps.length === 0 && selectedStartTime === null && selectedBarber?.id && selectedDate && (
            <Text style={styles.emptyStateText}>No available slots for this barber</Text>
          )}

          {/* New Barber Schedule Timeline */}
          {selectedBarber?.id && selectedDate && freeGaps.freeSlots?.length > 0 && (
            <BarberScheduleTimeline
              totalDuration={totalDuration}
              scheduleData={freeGaps}
              availableDurations={[30, 60, 90, 120]} // You can customize this list
              title="Choose Your Time Slot"
              date={selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              onTimeSelect={(selected) => {
                setSelectedStartTime(selected.startTime);
                // Optional: you could also store end time if needed later
                console.log('Selected slot:', selected.startTime, '-', selected.endTime);
              }}
            />
          )}

          {/* Loading or No Slots Message */}
          {selectedBarber?.id && selectedDate && (!freeGaps.freeSlots || freeGaps.freeSlots.length === 0) && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center' }}>
                No available time slots for this barber on the selected date.
              </Text>
            </View>
          )}

          {apiErrors.barbers && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Some barbers may not be loaded</Text>
            </View>
          )}
          {barberOptions.length === 1 && !apiErrors.barbers && (
            <Text style={styles.emptyStateText}>No specific barbers available</Text>
          )}
        </View>
      </ScrollView>


      {/* Enhanced Footer */}
      <View style={styles.footer}>
        {(selectedServices.length > 0 || selectedDate || selectedBarber) && (
          <View style={styles.bookingSummaryFooter}>
            <Text style={styles.footerSummaryText}>
              {selectedServices.length > 0 && `${selectedServices.length} services • `}
              {selectedDate && selectedDate.toLocaleDateString()}
              {(selectedServices.length > 0 || selectedDate) && selectedBarber && ' • '}
              {selectedBarber && selectedBarber.name}
              {selectedBarber && selectedStartTime && ` • ${selectedStartTime}`}
            </Text>
            {selectedServices.length > 0 && (
              <Text style={styles.footerPriceText}>₹{totalPrice}</Text>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.bookButton,
            (selectedServices.length === 0 || !selectedDate || !selectedBarber || !selectedStartTime) && styles.disabledButton
          ]}
          onPress={handleBookNow}
          disabled={selectedServices.length === 0 || !selectedDate || !selectedBarber || !selectedStartTime}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={20} color="#FFFFFF" style={styles.bookIcon} />
          <Text style={styles.bookButtonText}>
            {isBooking ? 'Processing...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  shopInfo: {
    marginBottom: 12,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  shopAddress: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 22,
  },
  timingBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingIcon: {
    marginTop: -2,
  },
  timingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  completedCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  sectionContent: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    backgroundColor: '#FF6B6B',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  barbersScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  barbersGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberCard: {
    width: 120,
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
  },
  selectedBarberCard: {
    transform: [{ scale: 1.05 }],
  },
  barberCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedBarberCircle: {
    backgroundColor: '#FF6B6B',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  barberInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748B',
  },
  selectedBarberInitial: {
    color: '#FFFFFF',
  },
  barberTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1E293B',
    fontWeight: '600',
    maxWidth: 80,
    marginBottom: 2,
  },
  barberMeta: {
    fontSize: 10,
    textAlign: 'center',
    color: '#64748B',
    maxWidth: 80,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceCard: {
    width: '31%',
    aspectRatio: 0.8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedServiceCard: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FEF2F2',
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedServiceIconContainer: {
    backgroundColor: '#FF6B6B',
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  serviceCheckIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  errorBox: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBoxText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 24,
    fontSize: 14,
  },
  noteText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
  selectionSummary: {
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
  },
  dateTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedDateSelector: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FEF2F2',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
    flex: 1,
    marginHorizontal: 12,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bookingSummaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  footerSummaryText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  footerPriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookIcon: {
    marginTop: -2,
  },
  disabledButton: {
    backgroundColor: '#FCA5A5',
    elevation: 0,
    shadowOpacity: 0,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 0,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  bookingSummary: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

// Old/Good Calendar Styles (Kept as-is for better visual consistency)
const calendarStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  calendarContainer: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledNav: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 40,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 20,
  },
  todayCell: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  selectedCell: {
    backgroundColor: '#FF6B6B',
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pastCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  todayText: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pastText: {
    color: '#CBD5E1',
  },
  calendarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
});