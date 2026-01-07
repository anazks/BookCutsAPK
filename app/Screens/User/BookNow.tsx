import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SlotBooking } from '../../api/Service/Booking';
import { getmyBarbers, getShopById, getShopServices } from '../../api/Service/Shop';
import { getBarberFreeTime, fetchAllAvailableTimeSlots } from '../../api/Service/Booking';
import BarberScheduleTimeline from './BarberScheduleTimeLine';

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
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  
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
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={calendarStyles.modalOverlay}>
        <View style={calendarStyles.calendarContainer}>
          <View style={calendarStyles.calendarHeader}>
            <TouchableOpacity 
              style={[calendarStyles.navButton, !canGoPrev && calendarStyles.disabledNav]}
              onPress={() => canGoPrev && navigateMonth('prev')}
              disabled={!canGoPrev}
            >
              <Text style={calendarStyles.navText}>Previous</Text>
            </TouchableOpacity>
            <Text style={calendarStyles.monthYear}>{months[currentMonth]} {currentYear}</Text>
            <TouchableOpacity style={calendarStyles.navButton} onPress={() => navigateMonth('next')}>
              <Text style={calendarStyles.navText}>Next</Text>
            </TouchableOpacity>
          </View>
          
          <View style={calendarStyles.daysHeader}>
            {daysOfWeek.map(day => <Text key={day} style={calendarStyles.dayHeaderText}>{day}</Text>)}
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
          
          <View style={calendarStyles.calendarFooter}>
            <TouchableOpacity style={calendarStyles.closeButton} onPress={onClose}>
              <Text style={calendarStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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

  const [freeGaps, setFreeGaps] = useState<any>({
    workHours: { from: "09:00", to: "21:00" },
    breaks: [],
    bookings: [],
    freeSlots: []
  });

  // New states for "Any Barber" slots
  const [allAvailableSlots, setAllAvailableSlots] = useState<string[]>([]);
  const [loadingAllSlots, setLoadingAllSlots] = useState(false);

  // Fetch specific barber schedule
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

  // Fetch all shop-wide slots when "Any Barber" is selected
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
      
      let slots: string[] = [];
      
      if (response?.success && response?.availableSlots?.success) {
        const freeSlots = response.availableSlots.schedule?.freeSlots || [];
        
        // Extract start times from freeSlots objects
        slots = freeSlots
          .map((slot: { from: string, to: string, minutes: number }) => slot.from)
          .filter((timeStr: string | undefined) => timeStr && typeof timeStr === 'string')
          .map((timeStr: string) => {
            const [hours, minutes] = timeStr.split(':');
            return `${hours.padStart(2, '0')}:${minutes || '00'}`;
          })
          .sort((a: string, b: string) => timeToMinutes(a) - timeToMinutes(b));
      }
      
      setAllAvailableSlots(slots);

      // Convert string slots to freeSlots format for BarberScheduleTimeline
      const timelineSlots = slots.map(time => ({
        from: time,
        to: addMinutesToTime(time, 30),
        minutes: 30
      }));
      
      // Update freeGaps with Any Barber slots
      setFreeGaps({
        workHours: { from: "09:00", to: "21:00" },
        breaks: [],
        bookings: [],
        freeSlots: timelineSlots
      });

      if (slots.length > 0 && !selectedStartTime) {
        setSelectedStartTime(slots[0]);
      } else if (slots.length === 0) {
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

  // Fetch slots when date or barber changes
  useEffect(() => {
    if (selectedDate) {
      if (selectedBarber?.id !== null && selectedBarber?.id !== undefined) {
        // Fetch specific barber schedule
        fetchFreeTimes();
      } else if (selectedBarber?.id === null) {
        // Fetch Any Barber slots
        fetchAllSlots();
      }
    } else {
      // Reset when no date selected
      setFreeGaps({ workHours: { from: "09:00", to: "21:00" }, breaks: [], bookings: [], freeSlots: [] });
      setAllAvailableSlots([]);
    }
  }, [selectedDate, selectedBarber?.id, fetchFreeTimes, fetchAllSlots]);

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
              duration: 30
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
    setSelectedStartTime(null); // Reset time when changing barber
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
          "Booking Confirmed", 
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
        
        // Reset form
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
        <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const progress = getProgressSteps();

  return (
    <SafeAreaView style={styles.container}>
      <ManualCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} isVisible={isCalendarVisible} onClose={() => setCalendarVisibility(false)} />

      <Modal visible={showConfirmation} transparent animationType="slide" onRequestClose={() => setShowConfirmation(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
              <Text style={styles.modalTitle}>Confirm Your Booking</Text>
              <Text style={styles.modalSubtitle}>Please review your appointment details</Text>
            </View>
            
            <View style={styles.bookingSummary}>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Services</Text><Text style={styles.summaryValue}>{selectedServices.map(s => s.name).join(', ')}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date</Text><Text style={styles.summaryValue}>{selectedDate?.toDateString()}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Barber</Text><Text style={styles.summaryValue}>{selectedBarber?.name || 'Any Barber'}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Time</Text><Text style={styles.summaryValue}>{selectedStartTime} - {addMinutesToTime(selectedStartTime || '00:00', totalDuration)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Duration</Text><Text style={styles.summaryValue}>{totalDuration} minutes</Text></View>
              <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalValue}>₹{totalPrice}</Text></View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowConfirmation(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmBooking} disabled={isBooking}><Text style={styles.confirmButtonText}>{isBooking ? 'Processing...' : 'Confirm Booking'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerSection}>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{shopDetails.name}</Text>
          <Text style={styles.shopAddress}>{shopDetails.address}</Text>
          <View style={styles.timingBadge}><Ionicons name="time-outline" size={14} color="#FFFFFF" /><Text style={styles.timingText}>Open {shopDetails.Timing || `${shopDetails.openingTime} - ${shopDetails.closingTime}`}</Text></View>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(progress.completed / progress.total) * 100}%` }]} /></View>
          <Text style={styles.progressText}>Step {progress.completed} of {progress.total}</Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Services */}
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="cut-outline" size={18} color="#FFFFFF" /></View><Text style={styles.sectionTitle}>Select Services</Text></View>
          <View style={styles.servicesGrid}>
            {allServices.map((service, index) => (
              <TouchableOpacity key={service.id || `default-${index}`} style={[styles.serviceCard, selectedServices.some(s => s.id === service.id) && styles.selectedServiceCard]} onPress={() => toggleService(service)}>
                <Text style={styles.serviceTitle} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
                {selectedServices.some(s => s.id === service.id) && <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.serviceCheckIcon} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedServices.length > 0 && (
          <View style={styles.selectionSummary}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total Duration</Text><Text style={styles.summaryValue}>{totalDuration} minutes</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total Cost</Text><Text style={styles.summaryPrice}>₹{totalPrice}</Text></View>
          </View>
        )}

        {/* Date */}
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="calendar-outline" size={18} color="#FFFFFF" /></View><Text style={styles.sectionTitle}>Select Date</Text></View>
          <TouchableOpacity style={[styles.dateTimeSelector, selectedDate && styles.selectedDateSelector]} onPress={() => setCalendarVisibility(true)}>
            <Ionicons name="calendar-outline" size={20} color="#64748B" />
            <Text style={selectedDate ? styles.selectedDateText : styles.placeholderText}>{selectedDate ? selectedDate.toDateString() : "Select Date"}</Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Barber & Time */}
        <View style={[styles.sectionContent, {paddingTop: 20}]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Select Barber & Time</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barbersScrollContent}>
            <View style={styles.barbersGrid}>
              {barberOptions.map(barber => (
                <TouchableOpacity 
                  key={barber.id || 'any'} 
                  style={[styles.barberCard, selectedBarber?.id === barber.id && styles.selectedBarberCard]} 
                  onPress={() => handleBarberSelect(barber)}
                >
                  <View style={[styles.barberCircle, selectedBarber?.id === barber.id && styles.selectedBarberCircle]}>
                    <Text style={[styles.barberInitial, selectedBarber?.id === barber.id && styles.selectedBarberInitial]}>
                      {barber.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.barberTextContainer}>
                    <Text style={styles.barberName} numberOfLines={1}>{barber.name}</Text>
                    {barber.id !== null && <Text style={styles.barberMeta} numberOfLines={1}>{barber.nativePlace}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Unified Timeline for Both Specific Barber and Any Barber */}
          {selectedDate && (
            <>
              {loadingAllSlots && !selectedBarber?.id ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FF6B6B" />
                  <Text style={{ marginTop: 12, fontSize: 16, color: '#64748B' }}>Loading available slots...</Text>
                </View>
              ) : freeGaps.freeSlots?.length > 0 ? (
                <BarberScheduleTimeline
                  totalDuration={totalDuration}
                  scheduleData={freeGaps}
                  availableDurations={[30, 60, 90, 120]}
                  title={`Choose Your Time Slot ${selectedBarber?.id ? `(${selectedBarber.name})` : '(Any Barber)'}`}
                  date={selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  onTimeSelect={(selected: any) => setSelectedStartTime(selected.startTime)}
                />
              ) : !loadingAllSlots && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center' }}>
                    {selectedBarber?.id 
                      ? `No available time slots for ${selectedBarber.name} on the selected date.`
                      : 'No available time slots for any barber on this date.'
                    }
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {(selectedServices.length > 0 || selectedDate || selectedBarber) && (
          <View style={styles.bookingSummaryFooter}>
            <Text style={styles.footerSummaryText}>
              {selectedServices.length > 0 && `${selectedServices.length} services • `}
              {selectedDate && selectedDate.toLocaleDateString()}
              {(selectedServices.length > 0 || selectedDate) && selectedBarber && ' • '}
              {selectedBarber && (selectedBarber.name || 'Any Barber')}
              {selectedBarber && selectedStartTime && ` • ${selectedStartTime}`}
            </Text>
            {selectedServices.length > 0 && <Text style={styles.footerPriceText}>₹{totalPrice}</Text>}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.bookButton, (selectedServices.length === 0 || !selectedDate || !selectedBarber || !selectedStartTime) && styles.disabledButton]}
          onPress={handleBookNow}
          disabled={selectedServices.length === 0 || !selectedDate || !selectedBarber || !selectedStartTime}
        >
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
          <Text style={styles.bookButtonText}>{isBooking ? 'Processing...' : 'Book Appointment'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
  
// All styles remain unchanged from your original code
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#64748B', fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  errorText: { fontSize: 16, color: '#DC2626', marginBottom: 24, textAlign: 'center', lineHeight: 24 },
  retryButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  headerSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  shopInfo: { marginBottom: 12 },
  shopName: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  shopAddress: { fontSize: 16, color: '#64748B', marginBottom: 12 },
  timingBadge: { backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  timingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  progressSection: { marginTop: 2 },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF6B6B', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#64748B', marginTop: 8, textAlign: 'center', fontWeight: '500' },
  scrollContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionContent: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIcon: { backgroundColor: '#FF6B6B', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', flex: 1 },
  barbersScrollContent: { paddingHorizontal: 16, paddingVertical: 8 },
  barbersGrid: { flexDirection: 'row', alignItems: 'center' },
  barberCard: { width: 120, height: 120, justifyContent: 'flex-start', alignItems: 'center', padding: 12, marginRight: 12 },
  selectedBarberCard: { transform: [{ scale: 1.05 }] },
  barberCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  selectedBarberCircle: { backgroundColor: '#FF6B6B' },
  barberInitial: { fontSize: 24, fontWeight: 'bold', color: '#64748B' },
  selectedBarberInitial: { color: '#FFFFFF' },
  barberTextContainer: { justifyContent: 'center', alignItems: 'center' },
  barberName: { fontSize: 12, textAlign: 'center', color: '#1E293B', fontWeight: '600', maxWidth: 80, marginBottom: 2 },
  barberMeta: { fontSize: 10, textAlign: 'center', color: '#64748B', maxWidth: 80 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  serviceCard: { width: '31%', aspectRatio: 0.8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  selectedServiceCard: { borderColor: '#FF6B6B', backgroundColor: '#FEF2F2' },
  serviceTitle: { fontSize: 12, fontWeight: '600', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  servicePrice: { fontSize: 14, fontWeight: '700', color: '#FF6B6B', marginBottom: 2 },
  serviceDuration: { fontSize: 10, color: '#64748B' },
  serviceCheckIcon: { position: 'absolute', top: -5, right: -5 },
  selectionSummary: { padding: 16, backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  summaryPrice: { fontSize: 16, color: '#1E293B', fontWeight: '700' },
  dateTimeSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF' },
  selectedDateSelector: { borderColor: '#FF6B6B', backgroundColor: '#FEF2F2' },
  selectedDateText: { fontSize: 16, color: '#1E293B', fontWeight: '600', flex: 1, marginHorizontal: 12 },
  placeholderText: { fontSize: 16, color: '#94A3B8', flex: 1, marginHorizontal: 12 },
  footer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  bookingSummaryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  footerSummaryText: { fontSize: 14, color: '#64748B', flex: 1 },
  footerPriceText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  bookButton: { backgroundColor: '#FF6B6B', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  disabledButton: { backgroundColor: '#FCA5A5' },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24 },
  modalHeader: { marginBottom: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  modalSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  bookingSummary: { marginBottom: 24 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 8 },
  totalLabel: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  totalValue: { fontSize: 18, color: '#FF6B6B', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  confirmButton: { backgroundColor: '#FF6B6B' },
  cancelButtonText: { color: '#475569', fontWeight: '600', fontSize: 16 },
  confirmButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

const calendarStyles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  calendarContainer: { width: '90%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, maxHeight: '80%' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  navButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  disabledNav: { backgroundColor: '#F8FAFC', opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  monthYear: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dayHeaderText: { fontSize: 12, fontWeight: '600', color: '#64748B', width: 40, textAlign: 'center', textTransform: 'uppercase' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 24 },
  dayCell: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginVertical: 4, borderRadius: 20 },
  todayCell: { backgroundColor: '#FEF2F2', borderWidth: 2, borderColor: '#FF6B6B' },
  selectedCell: { backgroundColor: '#FF6B6B' },
  pastCell: { opacity: 0.3 },
  dayText: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
  todayText: { color: '#FF6B6B', fontWeight: '700' },
  selectedText: { color: '#FFFFFF', fontWeight: '700' },
  pastText: { color: '#CBD5E1' },
  calendarFooter: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20, alignItems: 'center' },
  closeButton: { backgroundColor: '#F1F5F9', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: '#475569' },
});