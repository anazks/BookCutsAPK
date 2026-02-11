import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllAvailableTimeSlots, getBarberFreeTime, SlotBooking } from '../../api/Service/Booking';
import { getmyBarbers, getShopById, getShopServices } from '../../api/Service/Shop';
import BarberScheduleTimeline from './BarberScheduleTimeLine';

const { width } = Dimensions.get('window');

const parseTime = (timeStr: string) => {
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

const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const addMinutesToTime = (timeStr: string, minutesToAdd: number) => {
  const totalMin = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMin);
};

const ManualCalendar = ({ selectedDate, onDateSelect, isVisible, onClose }: any) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible]);

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push({ day, date, isToday, isPast, isSelected });
    }
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(prev => prev === 0 ? 11 : prev - 1);
      setCurrentYear(prev => prev - (currentMonth === 0 ? 1 : 0));
    } else {
      setCurrentMonth(prev => prev === 11 ? 0 : prev + 1);
      setCurrentYear(prev => prev + (currentMonth === 11 ? 1 : 0));
    }
  };
  
  const handleDateSelect = (dayObj: any) => {
    if (!dayObj || dayObj.isPast) return;
    onDateSelect(dayObj.date);
    onClose();
  };
  
  const calendarDays = generateCalendarDays();
  const today = new Date();
  const canGoPrev = currentYear > today.getFullYear() || (currentYear === today.getFullYear() && currentMonth > today.getMonth());
  
  if (!isVisible) return null;
  
  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={calendarStyles.modalOverlay}>
        <Animated.View style={[calendarStyles.calendarContainer, { opacity: fadeAnim }]}>
          <View style={calendarStyles.calendarHeader}>
            <TouchableOpacity 
              style={[calendarStyles.navButton, !canGoPrev && calendarStyles.disabledNav]}
              onPress={() => canGoPrev && navigateMonth('prev')}
              disabled={!canGoPrev}
            >
              <Ionicons name="chevron-back" size={20} color={canGoPrev ? "#D4AF37" : "rgba(212, 175, 55, 0.3)"} />
              <Text style={[calendarStyles.navText, !canGoPrev && calendarStyles.disabledNavText]}>Previous</Text>
            </TouchableOpacity>
            
            <View style={calendarStyles.monthYearContainer}>
              <Text style={calendarStyles.monthYear}>{months[currentMonth]} {currentYear}</Text>
              <Text style={calendarStyles.currentDateText}>
                {selectedDate ? selectedDate.toDateString() : 'Select a date'}
              </Text>
            </View>
            
            <TouchableOpacity style={calendarStyles.navButton} onPress={() => navigateMonth('next')}>
              <Text style={calendarStyles.navText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </TouchableOpacity>
          </View>
          
          <View style={calendarStyles.daysHeader}>
            {daysOfWeek.map(day => (
              <View key={day} style={calendarStyles.dayHeader}>
                <Text style={calendarStyles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>
          
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
                <View style={[
                  calendarStyles.dayInner,
                  dayObj?.isSelected && calendarStyles.selectedDayInner,
                ]}>
                  <Text style={[
                    calendarStyles.dayText,
                    dayObj?.isToday && calendarStyles.todayText,
                    dayObj?.isPast && calendarStyles.pastText,
                    dayObj?.isSelected && calendarStyles.selectedText,
                  ]}>
                    {dayObj?.day || ''}
                  </Text>
                  {dayObj?.isToday && !dayObj?.isSelected && (
                    <View style={calendarStyles.todayDot} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={calendarStyles.calendarFooter}>
            <View style={calendarStyles.legend}>
              <View style={calendarStyles.legendItem}>
                <View style={[calendarStyles.legendDot, calendarStyles.todayDot]} />
                <Text style={calendarStyles.legendText}>Today</Text>
              </View>
              <View style={calendarStyles.legendItem}>
                <View style={[calendarStyles.legendDot, { backgroundColor: '#D4AF37' }]} />
                <Text style={calendarStyles.legendText}>Selected</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={calendarStyles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={calendarStyles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function BookNow() {
  const { shop_id } = useLocalSearchParams();
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [isCalendarVisible, setCalendarVisibility] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState({ services: false, barbers: false });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [freeGaps, setFreeGaps] = useState<any>({
    workHours: { from: "09:00", to: "21:00" },
    breaks: [],
    bookings: [],
    freeSlots: []
  });

  const [allAvailableSlots, setAllAvailableSlots] = useState<string[]>([]);
  const [loadingAllSlots, setLoadingAllSlots] = useState(false);

  useEffect(() => {
    if (!loading && shopDetails) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, shopDetails]);

  const fetchFreeTimes = useCallback(async () => {
    if (!selectedDate || !selectedBarber?.id) {
      setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
      return;
    }

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    try {
      const response = await getBarberFreeTime(selectedBarber.id, dateStr, shop_id);
      if (response?.success && response?.availableHours?.success) {
        const apiSchedule = response.availableHours.schedule;
        const schedule = {
          workHours: { from: apiSchedule.workHours?.from || "09:00", to: apiSchedule.workHours?.to || "21:00" },
          breaks: (apiSchedule.breaks || []).map((b: any) => ({ startTime: b.startTime, endTime: b.endTime })),
          bookings: (apiSchedule.bookings || [])
            .filter((b: any) => b.bookingStatus === "confirmed" || b.status === "confirmed")
            .map((b: any) => ({ startTime: b.startTime, endTime: b.endTime })),
          freeSlots: (apiSchedule.freeSlots || []).map((slot: any) => ({
            from: slot.from,
            to: slot.to,
            minutes: slot.minutes || timeToMinutes(slot.to) - timeToMinutes(slot.from)
          }))
        };
        setFreeGaps(schedule);

        if (schedule.freeSlots.length > 0 && !selectedStartTime) {
          setSelectedStartTime(schedule.freeSlots[0].from);
        } else if (schedule.freeSlots.length === 0) {
          setSelectedStartTime(null);
        }
      } else {
        setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
        setSelectedStartTime(null);
      }
    } catch (err) {
      console.error('Error fetching barber schedule:', err);
      setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
      setSelectedStartTime(null);
    }
  }, [selectedDate, selectedBarber?.id, shop_id]);

  const fetchAllSlots = useCallback(async () => {
    if (!selectedDate || selectedBarber?.id !== null) {
      setAllAvailableSlots([]);
      setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
      setLoadingAllSlots(false);
      return;
    }

    setLoadingAllSlots(true);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    try {
      const response = await fetchAllAvailableTimeSlots(shop_id, dateStr);
      
      if (response?.success && response?.availableSlots?.success) {
        const freeSlots = response.availableSlots.schedule?.freeSlots || [];
        
        setFreeGaps({
          workHours: { from: "09:00", to: "21:00" },
          breaks: [],
          bookings: [],
          freeSlots: freeSlots.map(slot => ({
            from: slot.from,
            to: slot.to,
            minutes: slot.minutes
          }))
        });

        const startTimes = freeSlots
          .map(slot => slot.from)
          .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
        
        setAllAvailableSlots(startTimes);

        if (startTimes.length > 0 && !selectedStartTime) {
          setSelectedStartTime(startTimes[0]);
        } else if (startTimes.length === 0) {
          setSelectedStartTime(null);
        }
      } else {
        setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
        setAllAvailableSlots([]);
        setSelectedStartTime(null);
      }
    } catch (err) {
      console.error('Error fetching all available slots:', err);
      setAllAvailableSlots([]);
      setSelectedStartTime(null);
    } finally {
      setLoadingAllSlots(false);
    }
  }, [selectedDate, selectedBarber?.id, shop_id]);

  useEffect(() => {
    if (selectedDate) {
      if (selectedBarber?.id !== null && selectedBarber?.id !== undefined) {
        fetchFreeTimes();
      } else if (selectedBarber?.id === null) {
        fetchAllSlots();
      }
    } else {
      setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
      setAllAvailableSlots([]);
    }
  }, [selectedDate, selectedBarber?.id, fetchFreeTimes, fetchAllSlots]);

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

        const times = (shopData.Timing || '').split('-').map((t: string) => t.trim()).filter(Boolean);
        const openingTime = times.length > 0 ? parseTime(times[0]) : '09:00';
        const closingTime = times.length > 1 ? parseTime(times[1]) : '21:00';

        let services: any[] = [];
        let barbers: any[] = [];
        let servicesError = false;
        let barbersError = false;

        try {
          const servicesResponse = await getShopServices(shop_id);
          if (servicesResponse?.success) {
            services = servicesResponse.data.map((service: any) => ({
              id: service._id,
              name: service.ServiceName,
              price: parseInt(service.Rate, 10) || 0,
              duration: service.duration || 30
            }));
          } else servicesError = true;
        } catch (e) { servicesError = true; }

        try {
          const barbersResponse = await getmyBarbers(shop_id);
          if (barbersResponse?.success) {
            barbers = barbersResponse.data.map((barber: any) => ({
              id: barber._id,
              name: barber.BarberName,
              nativePlace: barber.From
            }));
          } else barbersError = true;
        } catch (e) { barbersError = true; }

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
      } catch (error: any) {
        setError(error.message || "Failed to load shop details");
      } finally {
        setLoading(false);
      }
    };

    if (shop_id) fetchShopData();
    else {
      setError('No shop ID provided');
      setLoading(false);
    }
  }, [shop_id]);

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0);

  const toggleService = (service: any) => {
    setSelectedServices(prev => 
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleBarberSelect = (barber: any) => {
    setSelectedBarber(barber);
    setSelectedStartTime(null);
  };

  const validateBooking = () => {
    if (selectedServices.length === 0) return "Please select at least one service";
    if (!selectedDate) return "Please select a date";
    if (!selectedBarber) return "Please select a barber";
    if (!selectedStartTime) return "Please select a time slot";
    return null;
  };

  const formatLocalDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const prepareBookingData = () => {
    const bookingDateStr = formatLocalDate(selectedDate!);
    const startTimeStr = selectedStartTime!;
    const endTimeStr = addMinutesToTime(startTimeStr, totalDuration);
    const startingTime = new Date(`${bookingDateStr}T${startTimeStr}:00`).toISOString();
    const endingTime = new Date(`${bookingDateStr}T${endTimeStr}:00`).toISOString();

    const serviceIds = selectedServices.map(s => s.id).filter(Boolean);

    const advanceAmount = Math.min(20, totalPrice * 0.2);
    const remainingAmount = totalPrice - advanceAmount;

    return {
      barberId: selectedBarber.id || null,
      userId: "69315678fca89f6d95026e4a",
      shopId: shopDetails?.id || null,
      serviceIds: serviceIds.length > 0 ? serviceIds : null,
      services: selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration
      })),
      bookingDate: bookingDateStr,
      timeSlot: { startingTime, endingTime },
      totalPrice,
      totalDuration,
      paymentType: 'advance',
      amountToPay: advanceAmount,
      remainingAmount,
      currency: 'INR',
      bookingStatus: 'pending',
      paymentId: null,
      paymentStatus: 'unpaid',
      amountPaid: 0
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
      const response = await SlotBooking(bookingData);
      
      if (response.success) {
        const bookingId = response.BookingStatus?._id;
        const endTimeStr = addMinutesToTime(selectedStartTime!, totalDuration);
        Alert.alert(
          "🎉 Booking Confirmed!", 
          `Your appointment with ${selectedBarber?.name || 'Any Barber'} is confirmed for ${selectedDate?.toDateString()} at ${selectedStartTime} - ${endTimeStr}`,
          [{ 
            text: "Continue to Payment", 
            onPress: () => {
              router.push({
                pathname: '/Screens/User/PayNow',
                params: {
                  bookingData: JSON.stringify(bookingData),
                  bookingId,
                  advanceAmount: Math.min(20, totalPrice),
                  totalPrice,
                  barberName: selectedBarber?.name || 'Any Barber',
                  bookingDate: selectedDate?.toLocaleDateString(),
                  timeSlot: `${selectedStartTime} - ${endTimeStr}`
                }
              });
            }
          }]
        );
        
        setSelectedBarber(null);
        setSelectedServices([]);
        setSelectedDate(null);
        setSelectedStartTime(null);
        setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
        setAllAvailableSlots([]);
      } else {
        throw new Error(response.message || "Booking failed");
      }
    } catch (error: any) {
      Alert.alert("Booking Error", error.message || "Failed to complete booking.");
    } finally {
      setIsBooking(false);
    }
  };

  const getProgressSteps = () => {
    let completed = 0;
    if (selectedServices.length > 0) completed++;
    if (selectedDate) completed++;
    if (selectedBarber && selectedStartTime) completed++;
    return { completed, total: 3 };
  };

  const allServices = shopDetails?.services ? [{ id: null, name: 'hair cut', price: 150, duration: 30 }, ...shopDetails.services] : [];
  const barberOptions = shopDetails?.barbers ? [{ id: null, name: 'Any Barber', nativePlace: 'Available' }, ...shopDetails.barbers] : [{ id: null, name: 'Any Barber', nativePlace: 'Available' }];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>LOADING...</Text>
        <Text style={styles.loadingSubtext}>Preparing your booking experience</Text>
      </View>
    );
  }

  if (error || !shopDetails) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#D4AF37" />
          <Text style={styles.errorText}>{error || "Failed to load shop details"}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => setLoading(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color="#0A0A0A" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = getProgressSteps();

  return (
    <SafeAreaView style={styles.container}>
      <ManualCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} isVisible={isCalendarVisible} onClose={() => setCalendarVisibility(false)} />

      <Modal visible={showConfirmation} transparent animationType="fade" onRequestClose={() => setShowConfirmation(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: fadeAnim }] }]}>
            <View style={styles.modalHeader}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#D4AF37" />
              </View>
              <Text style={styles.modalTitle}>Confirm Your Booking</Text>
              <Text style={styles.modalSubtitle}>Please review your appointment details</Text>
            </View>
            
            <View style={styles.bookingSummary}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="cut-outline" size={18} color="#D4AF37" />
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Services</Text>
                  <Text style={styles.summaryValue} numberOfLines={2}>{selectedServices.map(s => s.name).join(', ')}</Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="calendar-outline" size={18} color="#D4AF37" />
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{selectedDate?.toDateString()}</Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="person-outline" size={18} color="#D4AF37" />
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Barber</Text>
                  <Text style={styles.summaryValue}>{selectedBarber?.name || 'Any Barber'}</Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="time-outline" size={18} color="#D4AF37" />
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>{selectedStartTime} - {addMinutesToTime(selectedStartTime || '00:00', totalDuration)}</Text>
                </View>
              </View>
              
              <View style={styles.totalAmountContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalPrice}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowConfirmation(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Edit Details</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmBooking} 
                disabled={isBooking}
                activeOpacity={0.7}
              >
                {isBooking ? (
                  <ActivityIndicator size="small" color="#0A0A0A" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A']}
        style={styles.headerSection}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{shopDetails.name}</Text>
          <Text style={styles.sectionSubtitleGold}>Book Your Appointment</Text>
        </View>
      </LinearGradient>

      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressSteps}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepContainer}>
              <View style={[
                styles.stepCircle,
                step <= progress.completed && styles.stepCircleActive,
                step === progress.completed && styles.stepCircleCurrent
              ]}>
                {step < progress.completed ? (
                  <Ionicons name="checkmark" size={12} color="#0A0A0A" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    step <= progress.completed && styles.stepNumberActive
                  ]}>{step}</Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                step <= progress.completed && styles.stepLabelActive
              ]}>
                {step === 1 ? 'Services' : step === 2 ? 'Date' : 'Time'}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(progress.completed / progress.total) * 100}%` }]} />
        </View>
      </View>

      <Animated.ScrollView 
        ref={scrollViewRef} 
        style={[styles.scrollContainer, { opacity: fadeAnim }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Services</Text>
            <Text style={styles.sectionSubtitle}>Choose one or more services</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.servicesScrollContent}
          >
            {allServices.map((service, index) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <TouchableOpacity 
                  key={service.id || `default-${index}`} 
                  style={[
                    styles.compactServiceCard,
                    isSelected && styles.selectedCompactServiceCard
                  ]} 
                  onPress={() => toggleService(service)}
                  activeOpacity={0.7}
                >
                  <View style={styles.compactServiceCardContent}>
                    <Text style={styles.compactServiceTitle} numberOfLines={2}>{service.name}</Text>
                    <Text style={styles.compactServicePrice}>₹{service.price}</Text>
                    <View style={styles.compactServiceDurationBadge}>
                      <Ionicons name="time-outline" size={8} color="#0A0A0A" />
                      <Text style={styles.compactServiceDurationText}>{service.duration} min</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.compactServiceSelectedOverlay}>
                      <Ionicons name="checkmark-circle" size={16} color="#D4AF37" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <View style={styles.selectionSummary}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderText}>Selected Services</Text>
              <Text style={styles.summaryCount}>{selectedServices.length} item{selectedServices.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryDetail}>
                  <Ionicons name="time-outline" size={16} color="#D4AF37" />
                  <Text style={styles.summaryLabelSmall}>Duration</Text>
                  <Text style={styles.summaryValueSmall}>{totalDuration} min</Text>
                </View>
                <View style={styles.summaryDetail}>
                  <Ionicons name="cash-outline" size={16} color="#D4AF37" />
                  <Text style={styles.summaryLabelSmall}>Cost</Text>
                  <Text style={styles.summaryPriceSmall}>₹{totalPrice}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Date Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <Text style={styles.sectionSubtitle}>Choose your preferred date</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.dateSelector, selectedDate && styles.selectedDateSelector]} 
            onPress={() => setCalendarVisibility(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateSelectorContent}>
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar" size={24} color={selectedDate ? "#D4AF37" : "rgba(212, 175, 55, 0.4)"} />
              </View>
              <View style={styles.dateTextContainer}>
                <Text style={selectedDate ? styles.selectedDateLabel : styles.placeholderLabel}>
                  {selectedDate ? 'Selected Date' : 'Tap to select date'}
                </Text>
                <Text style={selectedDate ? styles.selectedDateText : styles.placeholderText}>
                  {selectedDate ? selectedDate.toDateString() : "Choose a date"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={selectedDate ? "#D4AF37" : "rgba(212, 175, 55, 0.4)"} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Barber & Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Barber & Time</Text>
            <Text style={styles.sectionSubtitle}>Choose your barber and time slot</Text>
          </View>

          {/* Barbers Selection */}
          <View style={styles.barbersSection}>
            <Text style={styles.barbersTitle}>AVAILABLE BARBERS</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.barbersScrollContent}
            >
              {barberOptions.map(barber => {
                const isSelected = selectedBarber?.id === barber.id;
                return (
                  <TouchableOpacity 
                    key={barber.id || 'any'} 
                    style={[
                      styles.barberCard,
                      isSelected && styles.selectedBarberCard
                    ]} 
                    onPress={() => handleBarberSelect(barber)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.barberAvatar,
                      isSelected && styles.selectedBarberAvatar
                    ]}>
                      <Text style={[
                        styles.barberInitial,
                        isSelected && styles.selectedBarberInitial
                      ]}>
                        {barber.name.charAt(0).toUpperCase()}
                      </Text>
                      {barber.id === null && (
                        <View style={styles.anyBarberBadge}>
                          <Ionicons name="people" size={12} color="#0A0A0A" />
                        </View>
                      )}
                    </View>
                    <View style={styles.barberInfo}>
                      <Text style={styles.barberName} numberOfLines={1}>{barber.name}</Text>
                      {barber.id !== null && (
                        <Text style={styles.barberFrom} numberOfLines={1}>
                          <Ionicons name="location" size={10} color="rgba(212, 175, 55, 0.6)" /> {barber.nativePlace}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View style={styles.barberSelectedIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="#D4AF37" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Slots */}
          {selectedDate && (
            <View style={styles.timeSlotsSection}>
              <View style={styles.timeSlotsHeader}>
                <Text style={styles.timeSlotsTitle}>
                  Available Time Slots {selectedBarber?.id ? `for ${selectedBarber.name}` : '(Any Barber)'}
                </Text>
                <Text style={styles.selectedDateDisplay}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              {loadingAllSlots && !selectedBarber?.id ? (
                <View style={styles.loadingSlotsContainer}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.loadingSlotsText}>Loading available slots...</Text>
                </View>
              ) : freeGaps.freeSlots?.length > 0 ? (
                <BarberScheduleTimeline
                  totalDuration={totalDuration}
                  scheduleData={freeGaps}
                  availableDurations={[30, 60, 90, 120]}
                  title={`Choose Your Time Slot`}
                  date={selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  onTimeSelect={(selected: any) => setSelectedStartTime(selected.startTime)}
                />
              ) : !loadingAllSlots && (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="time-outline" size={40} color="rgba(212, 175, 55, 0.3)" />
                  <Text style={styles.noSlotsText}>
                    {selectedBarber?.id 
                      ? `No available time slots for ${selectedBarber.name} on this date`
                      : 'No available time slots for any barber on this date'
                    }
                  </Text>
                  <Text style={styles.noSlotsSubtext}>
                    Please select a different date or barber
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        {(selectedServices.length > 0 || selectedDate || selectedBarber) && (
          <View style={styles.bookingPreview}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Appointment Summary</Text>
              {selectedServices.length > 0 && (
                <Text style={styles.previewPrice}>₹{totalPrice}</Text>
              )}
            </View>
            <View style={styles.previewDetails}>
              {selectedServices.length > 0 && (
                <View style={styles.previewItem}>
                  <Ionicons name="checkmark-circle" size={12} color="#D4AF37" />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {selectedDate && (
                <View style={styles.previewItem}>
                  <Ionicons name="calendar" size={12} color="#D4AF37" />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              )}
              {selectedBarber && (
                <View style={styles.previewItem}>
                  <Ionicons name="person" size={12} color="#D4AF37" />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {selectedBarber.name}
                  </Text>
                </View>
              )}
              {selectedStartTime && (
                <View style={styles.previewItem}>
                  <Ionicons name="time" size={12} color="#D4AF37" />
                  <Text style={styles.previewText} numberOfLines={1}>
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
            (selectedServices.length === 0 || !selectedDate || !selectedBarber || !selectedStartTime) && styles.disabledButton
          ]}
          onPress={handleBookNow}
          disabled={selectedServices.length === 0 || !selectedDate || !selectedBarber || !selectedStartTime}
          activeOpacity={0.7}
        >
          <View style={styles.bookButtonContent}>
            <Ionicons name="calendar" size={22} color="#0A0A0A" />
            <Text style={styles.bookButtonText}>
              {isBooking ? 'Processing...' : 'Book Appointment'}
            </Text>
          </View>
          {selectedServices.length > 0 && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>₹{totalPrice}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginTop: 16,
    letterSpacing: 1,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  errorContent: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 16,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  sectionSubtitleGold: {
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.8)',
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressSection: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepCircleActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  stepCircleCurrent: {
    backgroundColor: '#D4AF37',
    transform: [{ scale: 1.1 }],
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stepNumberActive: {
    color: '#0A0A0A',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  servicesScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  compactServiceCard: {
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
  },
  selectedCompactServiceCard: {
    borderColor: 'rgba(212, 175, 55, 0.6)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: [{ scale: 1.01 }],
  },
  compactServiceCardContent: {
    alignItems: 'flex-start',
  },
  compactServiceTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
    lineHeight: 13,
  },
  compactServicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 2,
  },
  compactServiceDurationBadge: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  compactServiceDurationText: {
    fontSize: 8,
    color: '#0A0A0A',
    fontWeight: '700',
  },
  compactServiceSelectedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  selectionSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  summaryCount: {
    fontSize: 14,
    color: 'rgba(212, 175, 55, 0.8)',
    fontWeight: '500',
  },
  summaryDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabelSmall: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  summaryPriceSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
  dateSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  selectedDateSelector: {
    borderColor: 'rgba(212, 175, 55, 0.6)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateTextContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  selectedDateLabel: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.8)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  placeholderLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 2,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  placeholderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  barbersSection: {
    marginTop: 8,
  },
  barbersTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(212, 175, 55, 0.8)',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  barbersScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  barberCard: {
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  selectedBarberCard: {
    borderColor: 'rgba(212, 175, 55, 0.6)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedBarberAvatar: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  barberInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectedBarberInitial: {
    color: '#0A0A0A',
  },
  anyBarberBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D4AF37',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  barberInfo: {
    alignItems: 'center',
  },
  barberName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  barberFrom: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  barberSelectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  timeSlotsSection: {
    marginTop: 24,
  },
  timeSlotsHeader: {
    marginBottom: 16,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  selectedDateDisplay: {
    fontSize: 14,
    color: 'rgba(212, 175, 55, 0.8)',
  },
  loadingSlotsContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingSlotsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  noSlotsContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noSlotsText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  bookingPreview: {
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(212, 175, 55, 0.8)',
    letterSpacing: 0.5,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
  },
  previewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  previewText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  priceBadge: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  priceBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  successIconContainer: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bookingSummary: {
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.8)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  totalAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    color: '#D4AF37',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#D4AF37',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 16,
  },
});

const calendarStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  calendarContainer: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  disabledNav: {
    opacity: 0.3,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  disabledNavText: {
    color: 'rgba(212, 175, 55, 0.3)',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  currentDateText: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.8)',
    marginTop: 2,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 8,
  },
  dayHeader: {
    width: 40,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212, 175, 55, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayInner: {
    backgroundColor: '#D4AF37',
  },
  todayCell: {},
  selectedCell: {},
  pastCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  todayText: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  selectedText: {
    color: '#0A0A0A',
    fontWeight: '700',
  },
  pastText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
  },
  calendarFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});