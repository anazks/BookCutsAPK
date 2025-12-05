import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Collapsible from 'react-native-collapsible';
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
  const [servicesCollapsed, setServicesCollapsed] = useState(true);
  const [barbersCollapsed, setBarbersCollapsed] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [apiErrors, setApiErrors] = useState({ services: false, barbers: false });
  const [showConfirmation, setShowConfirmation] = useState(false);

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
                bookingDate: selectedDate?.toDateString(),
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

  const toggleBarbers = useCallback(() => {
    setBarbersCollapsed(prev => !prev);
  }, []);

  const toggleServices = useCallback(() => {
    setServicesCollapsed(prev => !prev);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C5AA0" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (error || !shopDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Failed to load shop details"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getProgressSteps();
  const timeSlots = getTimeSlots();

  return (
    <View style={styles.container}>
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

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Step 1: Barber Selection */}
        <View style={[styles.stepCard, selectedBarber && styles.completedCard]}>
          <TouchableOpacity 
            style={styles.stepHeader}
            onPress={toggleBarbers}
            activeOpacity={0.7}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>Choose Your Barber</Text>
              <Text style={styles.stepSubtitle}>
                {selectedBarber 
                  ? 'Barber selected' 
                  : 'Select from our professional barbers'
                }
              </Text>
            </View>
            <View style={styles.collapseControls}>
              {selectedBarber && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>1</Text>
                </View>
              )}
              <Text style={styles.collapseText}>{barbersCollapsed ? 'Show' : 'Hide'}</Text>
            </View>
          </TouchableOpacity>

          <Collapsible collapsed={barbersCollapsed}>
            <View style={styles.optionsContainer}>
              {barberOptions.map(barber => (
                <TouchableOpacity
                  key={barber.id || 'default-barber'}
                  style={[
                    styles.serviceCard,
                    selectedBarber?.id === barber.id && styles.selectedOption
                  ]}
                  onPress={() => setSelectedBarber(barber)}
                >
                  <View style={styles.serviceContent}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceTitle}>{barber.name}</Text>
                      <Text style={styles.serviceMeta}>
                        {barber.id === null ? 'Available' : `From ${barber.nativePlace}`}
                      </Text>
                    </View>
                  </View>
                  {selectedBarber?.id === barber.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedCheck}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {apiErrors.barbers && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>Some barbers may not be loaded</Text>
                </View>
              )}
              {barberOptions.length === 1 && !apiErrors.barbers && (
                <Text style={styles.emptyStateText}>No specific barbers available</Text>
              )}
            </View>
          </Collapsible>
        </View>

        {/* Step 2: Services Selection */}
        <View style={[styles.stepCard, selectedServices.length > 0 && styles.completedCard]}>
          <TouchableOpacity 
            style={styles.stepHeader}
            onPress={toggleServices}
            activeOpacity={0.7}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>Select Services</Text>
              <Text style={styles.stepSubtitle}>
                {selectedServices.length > 0 
                  ? `${selectedServices.length} services selected`
                  : 'Choose from available services'
                }
              </Text>
            </View>
            <View style={styles.collapseControls}>
              {selectedServices.length > 0 && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>{selectedServices.length}</Text>
                </View>
              )}
              <Text style={styles.collapseText}>{servicesCollapsed ? 'Show' : 'Hide'}</Text>
            </View>
          </TouchableOpacity>

          <Collapsible collapsed={servicesCollapsed}>
            {apiErrors.services ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>Unable to load services</Text>
              </View>
            ) : allServices.length > 0 ? (
              <View style={styles.optionsContainer}>
                {allServices.map((service, index) => (
                  <TouchableOpacity
                    key={service.id || `default-service-${index}`}
                    style={[
                      styles.serviceCard,
                      selectedServices.some(s => s.id === service.id) && styles.selectedOption
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    <View style={styles.serviceContent}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceTitle}>{service.name}</Text>
                        <Text style={styles.serviceMeta}>{service.duration} minutes</Text>
                      </View>
                      <Text style={styles.servicePrice}>₹{service.price}</Text>
                    </View>
                    {selectedServices.some(s => s.id === service.id) && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyStateText}>No services available</Text>
            )}
          </Collapsible>

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
        </View>

        {/* Step 3: Date & Time Selection */}
    <View style={[styles.stepCard, selectedDate && selectedTimeSlot && styles.completedCard]}>
  <TouchableOpacity
    style={styles.stepHeader}
    onPress={() => setCalendarVisibility(true)}
    activeOpacity={0.7}
  >
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>3</Text>
    </View>
    <View style={styles.stepTitleContainer}>
      <Text style={styles.stepTitle}>Pick Date & Time</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred appointment slot</Text>
    </View>
    {selectedDate && selectedTimeSlot && (
      <View style={styles.completedBadge}>
        <Text style={styles.completedText}>Set</Text>
      </View>
    )}
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.dateSelector, selectedDate && styles.selectedDateSelector]}
    onPress={() => setCalendarVisibility(true)}
  >
    <Text style={styles.dateSelectorLabel}>Date</Text>
    <Text style={selectedDate ? styles.selectedDateText : styles.placeholderText}>
      {selectedDate ? selectedDate.toDateString() : "Tap to select date"}
    </Text>
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
        >
          <Text style={styles.bookButtonText}>
            {isBooking ? 'Processing...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: '#2C5AA0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  shopInfo: {
    marginBottom: 20,
  },
  shopName: {
    fontSize: 28,
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
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  timingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2C5AA0',
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
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  completedCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C5AA0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  completedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  collapseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapseText: {
    fontSize: 14,
    color: '#2C5AA0',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#2C5AA0',
    backgroundColor: '#EFF6FF',
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  serviceMeta: {
    fontSize: 14,
    color: '#64748B',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 16,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C5AA0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBox: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
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
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#2C5AA0',
    fontWeight: '700',
  },
  dateSelector: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  selectedDateSelector: {
    borderColor: '#2C5AA0',
    backgroundColor: '#EFF6FF',
  },
  dateSelectorLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    borderColor: '#2C5AA0',
    backgroundColor: '#2C5AA0',
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
    backgroundColor: '#2C5AA0',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2C5AA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  bookingSummary: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: '#2C5AA0',
    elevation: 2,
    shadowColor: '#2C5AA0',
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
    borderRadius: 16,
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
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2C5AA0',
  },
  selectedCell: {
    backgroundColor: '#2C5AA0',
    elevation: 2,
    shadowColor: '#2C5AA0',
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
    color: '#2C5AA0',
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