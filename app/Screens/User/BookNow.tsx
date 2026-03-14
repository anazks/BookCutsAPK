import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Correct SafeArea imports
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navigation & icons
import { Ionicons } from '@expo/vector-icons';

// Your custom components (adjust paths if needed)
import { BarberSelector } from './BookingComponent/BarberSelector';


import { BookingConfirmationModal } from './BookingComponent/BookingconfirmationModal';
import { BookingFooter } from './BookingComponent/BookingFooter';
import { DateSelector } from './BookingComponent/DateSelector';
import { DiscountBanner } from './BookingComponent/DiscountBanner';
import ManualCalendar from './BookingComponent/ManualCalender';
import { ProgressSteps } from './BookingComponent/ProgressSteps';
import { ServicesSelector } from './BookingComponent/ServiceSelector';
import { ShopHeader } from './BookingComponent/ShopHeader';
import { TimeSlotsSection } from './BookingComponent/TimeSlotSection';
import { useBookingFlow } from './BookingComponent/useBookingFlow';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BookNow() {
  const insets = useSafeAreaInsets();

  const {
    shopDetails,
    loading,
    error,
    allServices,
    barberOptions,
    selectedServices,
    toggleService,
    selectedDate,
    setSelectedDate,
    selectedBarber,
    handleBarberSelect,
    selectedStartTime,
    setSelectedStartTime,
    freeGaps,
    loadingSlots,
    totalDuration,
    priceDetails,
    showConfirmation,
    setShowConfirmation,
    isBooking,
    setIsBooking,
    handleBookNow,
    confirmBooking,
  } = useBookingFlow();

  useEffect(() => {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║          useBookingFlow DEBUG OUTPUT          ║');
  console.log('╠═══════════════════════════════════════════════╣');
  console.log('Loading:         ', loading);
  console.log('Error:           ', error);
  console.log('Shop Details:    ', shopDetails ? 'Loaded' : 'Not loaded');
  console.log('Shop Name:       ', shopDetails?.name);
  console.log('All Services:    ', allServices.length, 'items');
  console.log('Barber Options:  ', barberOptions.length, 'items');
  console.log('Selected Services:', selectedServices.length, 'selected');
  console.log('Selected Date:   ', selectedDate ? selectedDate.toISOString() : 'None');
  console.log('Selected Barber: ', selectedBarber?.name || 'None');
  console.log('Selected Time:   ', selectedStartTime || 'None');
  console.log('Free Gaps Slots: ', freeGaps.freeSlots?.length || 0, 'slots');
  console.log('Loading Slots:   ', loadingSlots);
  console.log('Total Duration:  ', totalDuration, 'min');
  console.log('Price Details:   ', priceDetails);
  console.log('Show Confirmation:', showConfirmation);
  console.log('Is Booking:      ', isBooking);
  console.log('╚═══════════════════════════════════════════════╝');
}, [
  loading, error, shopDetails, allServices, barberOptions,
  selectedServices.length, selectedDate, selectedBarber,
  selectedStartTime, freeGaps.freeSlots?.length, loadingSlots,
  totalDuration, priceDetails, showConfirmation, isBooking
]);

  const { baseTotal, discountAmount, finalTotal, hasDiscount } = priceDetails;

  // Animation value for fade-in
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Trigger fade-in when content is ready
  useState(() => {
    if (!loading && shopDetails) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, shopDetails]);

  // Calendar modal visibility
  const [isCalendarVisible, setCalendarVisibility] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          {/* <Text style={styles.loadingText}>Loading shop details...</Text>
          <Text style={styles.loadingSubtext}>Preparing your booking experience</Text> */}
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shopDetails) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error || "Failed to load shop details"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {/* you can add reload logic here */}}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Calendar Modal */}
      <ManualCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        isVisible={isCalendarVisible}
        onClose={() => setCalendarVisibility(false)}
      />

      {/* Confirmation Modal */}
      <BookingConfirmationModal
  visible={showConfirmation}
  onClose={() => setShowConfirmation(false)}
  onConfirm={confirmBooking}
  isBooking={isBooking}
  selectedServices={selectedServices}
  selectedDate={selectedDate}
  selectedBarber={selectedBarber}
  selectedStartTime={selectedStartTime}
  totalDuration={totalDuration}
  baseTotal={baseTotal}
  finalTotal={finalTotal}
  discountAmount={discountAmount}
  hasDiscount={hasDiscount}
/>

      {/* Header */}
      <ShopHeader shopName={shopDetails.name} />

      {/* Progress Steps */}
      <ProgressSteps
        completed={
          (selectedServices.length > 0 ? 1 : 0) +
          (selectedDate ? 1 : 0) +
          (selectedBarber && selectedStartTime ? 1 : 0)
        }
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ServicesSelector
          services={allServices}
          selectedServices={selectedServices}
          onToggleService={toggleService}
        />
{/* 
        {selectedServices.length > 0 && (
          <SelectedServicesSummary
            count={selectedServices.length}
            totalDuration={totalDuration}
            finalTotal={finalTotal}
          />
        )} */}

        {hasDiscount && <DiscountBanner discountAmount={discountAmount} />}

        <DateSelector
          selectedDate={selectedDate}
          onPress={() => setCalendarVisibility(true)}
        />

        <BarberSelector
          barbers={barberOptions}
          selectedBarber={selectedBarber}
          onSelect={handleBarberSelect}
        />

        {selectedDate ? (
          <TimeSlotsSection
            selectedDate={selectedDate}
            selectedBarber={selectedBarber}
            scheduleData={freeGaps}
            totalDuration={totalDuration}
            loading={loadingSlots}
            onTimeSelect={(sel) => setSelectedStartTime(sel.startTime)}
          />
        ) : (
          <View style={styles.placeholderSection}>
            <Text style={styles.placeholderText}>
              Select a date to see available time slots
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        servicesCount={selectedServices.length}
        selectedDate={selectedDate}
        selectedBarber={selectedBarber}
        selectedStartTime={selectedStartTime}
        finalTotal={finalTotal}
        hasDiscount={hasDiscount}
        discountAmount={discountAmount}
        isValid={
          selectedServices.length > 0 &&
          selectedDate !== null &&
          selectedBarber !== null &&
          selectedStartTime !== null
        }
        isBooking={isBooking}
        onBookPress={handleBookNow}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Root
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ScrollView
  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 0, // footer handles its own padding
  },

  // Placeholder when no date
  placeholderSection: {
    marginHorizontal: 20,
    marginVertical: 24,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },

  placeholderText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Loading ──────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Error ────────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});