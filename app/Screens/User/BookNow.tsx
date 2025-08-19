import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// Manual Calendar Component
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
              <Text style={calendarStyles.navText}>{'<'}</Text>
            </TouchableOpacity>
            
            <Text style={calendarStyles.monthYear}>
              {months[currentMonth]} {currentYear}
            </Text>
            
            <TouchableOpacity 
              style={calendarStyles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <Text style={calendarStyles.navText}>{'>'}</Text>
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
  const [servicesCollapsed, setServicesCollapsed] = useState(false);
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
    const startTime = new Date(`${bookingDateStr}T${selectedTimeSlot?.start}:00`);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + totalDuration);

    return {
      barberId: selectedBarber?.id,
      barberName: selectedBarber?.name || 'Unknown Barber',
      barberNativePlace: selectedBarber?.nativePlace || 'Unknown',
      shopId: shopDetails.id,
      shopName: shopDetails.name,
      serviceIds: selectedServices.map(s => s.id),
      services: selectedServices.map(service => ({
        id: service.id,
        name: service.name || 'Unknown Service',
        price: service.price || 0,
        duration: service.duration || 30
      })),
      bookingDate: bookingDateStr,
      timeSlotId: selectedTimeSlot?.id,
      timeSlotName: selectedTimeSlot?.name || 'Unknown Slot',
      timeSlotStart: selectedTimeSlot?.start || '00:00',
      timeSlotEnd: selectedTimeSlot?.end || '00:00',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalPrice,
      totalDuration,
      paymentType: 'full',
      amountToPay: totalPrice,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#555" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (error || !shopDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Failed to load shop details"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getProgressSteps();
  const timeSlots = getTimeSlots();

  return (
    <View style={styles.container}>
      {/* Manual Calendar */}
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
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryText}>Barber: {selectedBarber?.name}</Text>
              <Text style={styles.summaryText}>Date: {selectedDate?.toDateString()}</Text>
              <Text style={styles.summaryText}>Time: {selectedTimeSlot?.name} ({selectedTimeSlot?.start}-{selectedTimeSlot?.end})</Text>
              <Text style={styles.summaryText}>Services: {selectedServices.map(s => s.name).join(', ')}</Text>
              <Text style={styles.summaryText}>Duration: {totalDuration} minutes</Text>
              <Text style={styles.summaryText}>Total: ₹{totalPrice}</Text>
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

      {/* Main Content */}
      <View style={styles.shopHeader}>
        <Text style={styles.shopName}>{shopDetails.name}</Text>
        <Text style={styles.shopAddress}>{shopDetails.address}</Text>
        <Text style={styles.shopHours}>Open: {shopDetails.Timing || `${shopDetails.openingTime} - ${shopDetails.closingTime}`}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(progress.completed / progress.total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.completed}/{progress.total} steps completed</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Barber Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Select Barber</Text>
            {selectedBarber && <Text style={styles.checkmark}>✓</Text>}
          </View>
          
          {apiErrors.barbers ? (
            <Text style={styles.errorText}>Failed to load barbers</Text>
          ) : shopDetails.barbers.length > 0 ? (
            <View style={styles.barberContainer}>
              {shopDetails.barbers.map(barber => (
                <TouchableOpacity
                  key={barber.id}
                  style={[
                    styles.barberItem,
                    selectedBarber?.id === barber.id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedBarber(barber)}
                >
                  <Text style={styles.barberName}>{barber.name}</Text>
                  <Text style={styles.barberPlace}>{barber.nativePlace}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No barbers available</Text>
          )}
        </View>

        {/* Services Selection */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.cardHeader}
            onPress={() => setServicesCollapsed(!servicesCollapsed)}
          >
            <Text style={styles.cardTitle}>Select Services</Text>
            <View style={styles.collapseHeader}>
              {selectedServices.length > 0 && (
                <Text style={styles.selectedCount}>{selectedServices.length} selected</Text>
              )}
              <Text style={styles.collapseIcon}>{servicesCollapsed ? '▼' : '▲'}</Text>
            </View>
          </TouchableOpacity>

          <Collapsible collapsed={servicesCollapsed}>
            {apiErrors.services ? (
              <Text style={styles.errorText}>Failed to load services</Text>
            ) : shopDetails.services.length > 0 ? (
              <View style={styles.servicesGrid}>
                {shopDetails.services.map(service => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceItem,
                      selectedServices.some(s => s.id === service.id) && styles.selectedItem
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {selectedServices.some(s => s.id === service.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.servicePrice}>₹{service.price}</Text>
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No services available</Text>
            )}
          </Collapsible>

          {selectedServices.length > 0 && (
            <View style={styles.servicesSummary}>
              <Text style={styles.summaryTitle}>Selected Services</Text>
              <Text style={styles.summaryText}>
                {selectedServices.length} services • {totalDuration} min • ₹{totalPrice}
              </Text>
            </View>
          )}
        </View>

        {/* Date & Time Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Select Date & Time</Text>
            {selectedDate && selectedTimeSlot && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <TouchableOpacity
            style={[styles.dateButton, selectedDate && styles.selectedButton]}
            onPress={() => setCalendarVisibility(true)}
          >
            <Text style={selectedDate ? styles.dateText : styles.placeholderText}>
              {selectedDate ? selectedDate.toDateString() : "Select date"}
            </Text>
          </TouchableOpacity>

          {selectedDate && (
            <>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              <View style={styles.timeSlotsContainer}>
                {timeSlots.map(slot => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlot,
                      selectedTimeSlot?.id === slot.id && styles.selectedItem
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text style={styles.timeSlotName}>{slot.name}</Text>
                    <Text style={styles.timeSlotHours}>{slot.start} - {slot.end}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedBarber || selectedServices.length === 0 || !selectedDate || !selectedTimeSlot) && styles.disabledButton
          ]}
          onPress={handleBookNow}
          disabled={!selectedBarber || selectedServices.length === 0 || !selectedDate || !selectedTimeSlot}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Text style={styles.bookButtonSubtext}>
            {selectedServices.length > 0 && `Total: ₹${totalPrice} • ${totalDuration} min`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  shopHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  shopHours: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#333',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 12,
    color: '#4CAF50',
    marginRight: 8,
    fontWeight: '600',
  },
  collapseIcon: {
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  barberContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  barberItem: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  barberPlace: {
    fontSize: 14,
    color: '#666',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  selectedItem: {
    borderColor: '#333',
    backgroundColor: '#f9f9f9',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
  },
  servicesSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  dateButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedButton: {
    borderColor: '#333',
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  timeSlotName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeSlotHours: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bookButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  bookingSummary: {
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eee',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#333',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

// Calendar Styles
const calendarStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledNav: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  navText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'center',
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
    marginVertical: 2,
    borderRadius: 20,
  },
  todayCell: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  selectedCell: {
    backgroundColor: '#333',
  },
  pastCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastText: {
    color: '#ccc',
  },
  calendarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});