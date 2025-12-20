import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SlotBooking } from '../../api/Service/Booking';
import { getmyBarbers, getShopById, getShopServices } from '../../api/Service/Shop';

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

export default function BookNow() {
  const { shop_id } = useLocalSearchParams();
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isCalendarVisible, setCalendarVisibility] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [apiErrors, setApiErrors] = useState({ services: false, barbers: false });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const scrollViewRef = useRef(null);

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);
        setApiErrors({ services: false, barbers: false });

        const shopResponse = await getShopById(shop_id);
        if (!shopResponse?.success) throw new Error(shopResponse?.message || "Failed to load shop");

        const shopData = shopResponse.data[0];
        const times = shopData.Timing?.split('-')?.map(t => t.trim()) || [];
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

  // Auto-scroll to time slots when date is selected
  useEffect(() => {
    if (selectedDate && scrollViewRef.current) {
      // Small delay to allow re-render with time slots visible
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [selectedDate]);

  const getTimeSlots = () => {
    if (!shopDetails) return [];
    return [
      { id: 1, name: "Morning", start: shopDetails.openingTime, end: "12:00" },
      { id: 2, name: "Noon", start: "12:00", end: "15:00" },
      { id: 3, name: "Evening", start: "15:00", end: "19:00" },
      { id: 4, name: "Night", start: "19:00", end: shopDetails.closingTime },
    ];
  };

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

  const validateBooking = () => {
    if (!selectedBarber) return "Please select a barber";
    if (selectedServices.length === 0) return "Please select at least one service";
    if (!selectedDate) return "Please select a date";
    if (!selectedTimeSlot) return "Please select a time slot";
    return null;
  };

const prepareBookingData = () => {
  const bookingDateStr = selectedDate?.toISOString().split('T')[0];
  const startTime = new Date(`${bookingDateStr}T${selectedTimeSlot?.start || '00:00'}:00`);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + (totalDuration || 30));

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

  return {
    barberId: getValidId(selectedBarber?.id), // null if user selects "any barber"
    barberName: selectedBarber?.name || 'Any Barber',
    barberNativePlace: selectedBarber?.nativePlace || 'Available',
    shopId: shopDetails?.id || null,
    shopName: shopDetails?.name || 'Unknown Shop',
    serviceIds: serviceIdsTemp.length > 0 ? serviceIdsTemp : null, // null if no specific service
    services: selectedServices?.length
      ? selectedServices.map(service => ({
          id: getValidId(service.id), // null if no id
          name: service.name || 'Unknown Service',
          price: service.price || 0,
          duration: service.duration || 30
        })).filter(service => service.id !== null || selectedServices.length === 1) // retain at least one if only default
      : [{ id: null, name: 'Any Service', price: 0, duration: 30 }], // null for default id
    bookingDate: bookingDateStr,
    timeSlotId: selectedTimeSlot?.id || null,
    timeSlotName: selectedTimeSlot?.name || 'Unknown Slot',
    timeSlotStart: selectedTimeSlot?.start || '00:00',
    timeSlotEnd: selectedTimeSlot?.end || '00:00',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    totalPrice: totalPrice || 0,
    totalDuration: totalDuration || 30,
    paymentType: 'full',
    amountToPay: totalPrice || 0,
    remainingAmount: 0,
    currency: 'INR',
    bookingTimestamp: new Date().toISOString(),
    bookingStatus: 'pending',
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
    console.log('Submitting booking:', bookingData);
    
    const response = await SlotBooking(bookingData);
    console.log("..........................",response,"-------------------------------------------------------------------------------------------------------")
    if (response.success) {
      // Get the booking ID from the response
      const bookingId = response.BookingStatus?._id 
      console.log(bookingId,"<><><><><><><><><><><><><><><><><><><><>")
      Alert.alert(
        "Booking Confirmed", 
        `Your appointment with ${selectedBarber.name} is confirmed for ${selectedDate.toDateString()}`,
        [{ 
          text: "Continue to Payment", 
          onPress: () => {
            router.push({
              pathname: '/Screens/User/PayNow',
              params: {
                bookingData: JSON.stringify(bookingData),
                bookingId: bookingId, // Add the booking ID here
                advanceAmount: Math.min(20, totalPrice),
                totalPrice,
                barberName: selectedBarber?.name,
                bookingDate: selectedDate?.toLocaleDateString(),
                timeSlot: selectedTimeSlot?.name
              }
            });
          }
        }]
      );
      
      // Reset form
      setSelectedBarber(null);
      setSelectedServices([]);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
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
    // The useEffect will automatically refetch when loading changes
  };

  const getProgressSteps = () => {
    let completed = 0;
    if (selectedBarber) completed++;
    if (selectedServices.length > 0) completed++;
    if (selectedDate && selectedTimeSlot) completed++;
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
  const timeSlots = getTimeSlots();

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
                <Text style={styles.summaryLabel}>Barber</Text>
                <Text style={styles.summaryValue}>{selectedBarber?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{selectedDate?.toDateString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{selectedTimeSlot?.name} ({selectedTimeSlot?.start}-{selectedTimeSlot?.end})</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Services</Text>
                <Text style={styles.summaryValue}>{selectedServices.map(s => s.name).join(', ')}</Text>
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
        {/* Barber Selection - Horizontal Scroll Layout */}
        <View style={styles.sectionContent}>
         <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Select Barber</Text>
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
                onPress={() => setSelectedBarber(barber)}
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
          {apiErrors.barbers && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Some barbers may not be loaded</Text>
            </View>
          )}
          {barberOptions.length === 1 && !apiErrors.barbers && (
            <Text style={styles.emptyStateText}>No specific barbers available</Text>
          )}
        </View>

        {/* Services Selection - Grid Layout */}
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

        {/* Date & Time Selection */}
        <View style={[styles.sectionCard, (selectedDate && selectedTimeSlot) && styles.completedCard]}>
          <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Date & Time</Text>
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
            <Ionicons name="time-outline" size={20} color="#64748B" />
          </TouchableOpacity>

          {selectedDate && (
            <View style={styles.timeSlotsSection}>
              <Text style={styles.sectionLabel}>Available Time Slots</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map(slot => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlotCard,
                      selectedTimeSlot?.id === slot.id && styles.selectedTimeSlot
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.timeSlotName,
                      selectedTimeSlot?.id === slot.id && styles.selectedTimeSlotText
                    ]}>
                      {slot.name}
                    </Text>
                    <Text style={[
                      styles.timeSlotHours,
                      selectedTimeSlot?.id === slot.id && styles.selectedTimeSlotText
                    ]}>
                      {slot.start} - {slot.end}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Enhanced Footer */}
      <View style={styles.footer}>
        {(selectedServices.length > 0 || selectedDate || selectedBarber) && (
          <View style={styles.bookingSummaryFooter}>
            <Text style={styles.footerSummaryText}>
              {selectedServices.length > 0 && `${selectedServices.length} services`}
              {selectedServices.length > 0 && selectedDate && ' • '}
              {selectedDate && selectedDate.toLocaleDateString()}
              {(selectedServices.length > 0 || selectedDate) && selectedBarber && ' • '}
              {selectedBarber && selectedBarber.name}
            </Text>
            {selectedServices.length > 0 && (
              <Text style={styles.footerPriceText}>₹{totalPrice}</Text>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedBarber || selectedServices.length === 0 || !selectedDate || !selectedTimeSlot) && styles.disabledButton
          ]}
          onPress={handleBookNow}
          disabled={!selectedBarber || selectedServices.length === 0 || !selectedDate || !selectedTimeSlot}
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
    marginBottom: 50,
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
    marginBottom: 16,
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
  timeSlotsSection: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  timeSlotName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
  },
  timeSlotHours: {
    fontSize: 12,
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
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