import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Hardcoded data
const SERVICES = [
  { id: '1', name: 'Haircut', duration: 30, price: 25 },
  { id: '2', name: 'Beard Trim', duration: 20, price: 15 },
  { id: '3', name: 'Haircut + Beard', duration: 45, price: 35 },
  { id: '4', name: 'Kids Haircut', duration: 25, price: 20 },
  { id: '5', name: 'Hot Towel Shave', duration: 40, price: 30 },
  { id: '6', name: 'Hair Coloring', duration: 90, price: 60 },
];

const BARBERS = [
  { id: '1', name: 'John Smith', rating: 4.8, specialties: ['Haircut', 'Beard'], image: null },
  { id: '2', name: 'Mike Johnson', rating: 4.9, specialties: ['Haircut', 'Coloring'], image: null },
  { id: '3', name: 'David Wilson', rating: 4.7, specialties: ['Hot Towel Shave', 'Beard'], image: null },
  { id: '4', name: 'Sarah Brown', rating: 5.0, specialties: ['All Services'], image: null },
  { id: '5', name: 'Chris Lee', rating: 4.6, specialties: ['Haircut', 'Kids Haircut'], image: null },
];

// Generate time slots (9 AM to 7 PM, 30 min intervals)
const generateTimeSlots = (selectedBarber, selectedServices) => {
  const totalDuration = selectedServices.reduce((acc, service) => acc + service.duration, 0);
  const slots = [];
  const startHour = 9;
  const endHour = 19;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const [hours, mins] = timeString.split(':').map(Number);
      const slotEndTime = hours * 60 + mins + totalDuration;
      const endHour_time = Math.floor(slotEndTime / 60);
      const endMin_time = slotEndTime % 60;
      
      if (endHour_time < endHour || (endHour_time === endHour && endMin_time === 0)) {
        slots.push({
          id: `${hour}-${minute}`,
          time: timeString,
          endTime: `${endHour_time.toString().padStart(2, '0')}:${endMin_time.toString().padStart(2, '0')}`,
          available: Math.random() > 0.3, // Random availability for demo
        });
      }
    }
  }
  return slots;
};

// Generate dates for next 7 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      id: i.toString(),
      day: days[date.getDay()],
      date: date.getDate().toString(),
      month: months[date.getMonth()],
      fullDate: date,
      isToday: i === 0,
    });
  }
  return dates;
};

const BookingScreen = () => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(generateDates()[0]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dates] = useState(generateDates());
  const [timeSlots, setTimeSlots] = useState([]);

  const toggleService = (service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const selectBarber = (barber) => {
    setSelectedBarber(barber);
    if (selectedServices.length > 0) {
      setTimeSlots(generateTimeSlots(barber, selectedServices));
    }
    setSelectedSlot(null);
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    if (selectedBarber && selectedServices.length > 0) {
      setTimeSlots(generateTimeSlots(selectedBarber, selectedServices));
    }
    setSelectedSlot(null);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((acc, service) => acc + service.duration, 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((acc, service) => acc + service.price, 0);
  };

  const renderServiceItem = ({ item }) => {
    const isSelected = selectedServices.find(s => s.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.serviceCard, isSelected && styles.selectedCard]}
        onPress={() => toggleService(item)}
      >
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDuration}>{item.duration} min</Text>
        </View>
        <Text style={styles.servicePrice}>${item.price}</Text>
        {isSelected && (
          <Icon name="check-circle" size={24} color="#4CAF50" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderBarberItem = ({ item }) => {
    const isSelected = selectedBarber?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.barberCard, isSelected && styles.selectedCard]}
        onPress={() => selectBarber(item)}
      >
        <View style={styles.barberAvatar}>
          <Icon name="person" size={30} color="#666" />
        </View>
        <View style={styles.barberInfo}>
          <Text style={styles.barberName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <Text style={styles.specialties}>{item.specialties.join(' • ')}</Text>
        </View>
        {isSelected && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  const renderDateItem = ({ item }) => {
    const isSelected = selectedDate?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.dateCard, isSelected && styles.selectedDateCard]}
        onPress={() => selectDate(item)}
      >
        <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>{item.day}</Text>
        <Text style={[styles.dateNumber, isSelected && styles.selectedDateText]}>{item.date}</Text>
        <Text style={[styles.dateMonth, isSelected && styles.selectedDateText]}>{item.month}</Text>
        {item.isToday && <Text style={styles.todayTag}>Today</Text>}
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = ({ item }) => {
    const isSelected = selectedSlot?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot,
          !item.available && styles.unavailableSlot,
        ]}
        onPress={() => item.available && setSelectedSlot(item)}
        disabled={!item.available}
      >
        <Text style={[
          styles.timeText,
          isSelected && styles.selectedTimeText,
          !item.available && styles.unavailableText,
        ]}>
          {item.time}
        </Text>
        <Text style={[
          styles.timeEndText,
          !item.available && styles.unavailableText,
        ]}>
          - {item.endTime}
        </Text>
        {!item.available && (
          <Text style={styles.bookedText}>Booked</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <TouchableOpacity>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Services</Text>
            {selectedServices.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                {getTotalDuration()} min • ${getTotalPrice()}
              </Text>
            )}
          </View>
          <FlatList
            data={SERVICES}
            renderItem={renderServiceItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.servicesList}
          />
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <FlatList
            data={dates}
            renderItem={renderDateItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesList}
          />
        </View>

        {/* Barber Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Barber</Text>
          <FlatList
            data={BARBERS}
            renderItem={renderBarberItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.barbersList}
          />
        </View>

        {/* Time Slots */}
        {selectedBarber && selectedServices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Slots</Text>
              <Text style={styles.sectionSubtitle}>
                {timeSlots.filter(slot => slot.available).length} slots available
              </Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map(slot => renderTimeSlot({ item: slot }))}
            </View>
          </View>
        )}

        {/* Booking Summary */}
        {selectedServices.length > 0 && selectedDate && selectedBarber && selectedSlot && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Services:</Text>
              <Text style={styles.summaryValue}>
                {selectedServices.map(s => s.name).join(' + ')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{getTotalDuration()} minutes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {selectedDate.day}, {selectedDate.month} {selectedDate.date}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>
                {selectedSlot.time} - {selectedSlot.endTime}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Barber:</Text>
              <Text style={styles.summaryValue}>{selectedBarber.name}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${getTotalPrice()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      {selectedServices.length > 0 && selectedDate && selectedBarber && selectedSlot && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2B3C',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B3C',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  servicesList: {
    gap: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2B3C',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 10,
  },
  checkIcon: {
    marginLeft: 5,
  },
  datesList: {
    gap: 12,
    paddingVertical: 5,
  },
  dateCard: {
    width: 70,
    padding: 12,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  selectedDateCard: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dateDay: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2B3C',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  selectedDateText: {
    color: '#FFF',
  },
  todayTag: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
  barbersList: {
    gap: 8,
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  barberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2B3C',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  specialties: {
    fontSize: 12,
    color: '#4CAF50',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeSlot: {
    width: '31%',
    padding: 12,
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unavailableSlot: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2B3C',
  },
  timeEndText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 2,
  },
  selectedTimeText: {
    color: '#FFF',
  },
  unavailableText: {
    color: '#BDBDBD',
  },
  bookedText: {
    fontSize: 10,
    color: '#F44336',
    marginTop: 2,
  },
  summarySection: {
    backgroundColor: '#FFF',
    marginTop: 12,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B3C',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A2B3C',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E9F0',
    marginVertical: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B3C',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E9F0',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default BookingScreen;