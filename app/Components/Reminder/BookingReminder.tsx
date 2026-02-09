import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchUpcomingBooking } from '@/app/api/Service/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BookingReminder() {
  const [bookingData, setBookingData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const clockScaleAnim = useRef(new Animated.Value(0.8)).current;

  // IST formatters
  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  function getStartTimeDate(): Date | null {
    if (!bookingData?.timeSlot?.startingTime) return null;
    return new Date(bookingData.timeSlot.startingTime);
  }

  function getEndTimeDate(): Date | null {
    if (!bookingData?.timeSlot?.endingTime) return null;
    return new Date(bookingData.timeSlot.endingTime);
  }

  function calculateTimeLeft() {
    const startTime = getStartTimeDate();
    if (!startTime || bookingData?.bookingStatus === 'cancelled') {
      return null;
    }

    const now = new Date();
    const difference = startTime.getTime() - now.getTime();

    if (difference <= 0) {
      return null;
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  const handlePress = () => {
    if (bookingData) openModal();
  };

  const openModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(clockScaleAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.ease }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 90 }),
      ]).start();
    });
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, bounciness: 12 }),
        Animated.spring(clockScaleAnim, { toValue: 0.8, useNativeDriver: true, bounciness: 12, delay: 100 }),
      ]).start();
    });
  };

  const formatDisplayDate = () => {
    const startTime = getStartTimeDate();
    if (!startTime) return '—';
    return dateFormatter.format(startTime);
  };

  const formatDisplayTime = () => {
    const startTime = getStartTimeDate();
    const endTime = getEndTimeDate();
    if (!startTime || !endTime) return '—';

    const start = timeFormatter.format(startTime);
    const end = timeFormatter.format(endTime);

    return `${start} – ${end}`;
  };

  // Fetch upcoming booking
  useEffect(() => {
    const loadUpcomingBooking = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setBookingData(null);
          return;
        }

        const response = await fetchUpcomingBooking(userId);
        console.log("API response ---", response);

        // The new response has { success, message, booking, shopDetails }
        if (response?.success && response?.booking) {
          // Merge booking and shopDetails into one object for easier access
          const enrichedBooking = {
            ...response.booking,
            shopDetails: response.shopDetails || null,
          };
          setBookingData(enrichedBooking);
        } else {
          setBookingData(null);
        }
      } catch (error) {
        console.error('Error fetching upcoming booking:', error);
        setBookingData(null);
      }
    };

    loadUpcomingBooking();
  }, []);

  // Countdown + visibility logic
  useEffect(() => {
    if (!bookingData) {
      setWidgetVisible(false);
      setTimeLeft(null);
      return;
    }

    const updateTimerAndVisibility = () => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      const now = new Date();
      const endTime = getEndTimeDate();

      if (!endTime) {
        setWidgetVisible(false);
        return;
      }

      const hasNotEnded = now < endTime;
      setWidgetVisible(hasNotEnded && newTimeLeft !== null);
    };

    updateTimerAndVisibility();
    const timer = setInterval(updateTimerAndVisibility, 1000);

    // Animations
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, bounciness: 12, delay: 500 }),
      Animated.spring(clockScaleAnim, { toValue: 0.8, useNativeDriver: true, bounciness: 12, delay: 600 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    const bounceInterval = setInterval(() => {
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.02, useNativeDriver: true, bounciness: 12 }),
        Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      ]).start();
    }, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(bounceInterval);
    };
  }, [bookingData]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  if (!widgetVisible || !timeLeft) return null;

  return (
    <>
      {/* Floating Widget */}
      <Animated.View style={[styles.fixedBottomWidget, { transform: [{ scale: bounceAnim }] }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <Animated.View style={[styles.widgetContent, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.leftSection}>
              <Animated.View style={[styles.clockIconContainer, { transform: [{ scale: clockScaleAnim }] }]}>
                <View style={styles.clockIcon}>
                  <Ionicons name="time" size={18} color="white" />
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>!</Text>
                </View>
              </Animated.View>

              <View style={styles.timeInfo}>
                <Text style={styles.widgetTitle}>UPCOMING APPOINTMENT</Text>
                <View style={styles.countdownContainer}>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(timeLeft.days).padStart(2, '0')}</Text>
                    <Text style={styles.countdownLabel}>Days</Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                    <Text style={styles.countdownLabel}>Hours</Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                    <Text style={styles.countdownLabel}>Min</Text>
                  </View>
                </View>
                <Text style={styles.shopName}>
                  {bookingData?.shopDetails?.ShopName || 'Salon'}
                </Text>
              </View>
            </View>

            <View style={styles.viewButtonContainer}>
              <View style={styles.viewButton}>
                <View style={styles.shimmerOverlay}>
                  <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
                </View>
                <Text style={styles.viewButtonText}>VIEW</Text>
                <Feather name="arrow-right" size={12} color="white" />
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="calendar" size={24} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>Appointment Details</Text>
                    <Text style={styles.headerSubtitle}>Your upcoming booking</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.timerCard}>
                  <View style={styles.timerHeader}>
                    <Ionicons name="time-outline" size={20} color="#4F46E5" />
                    <Text style={styles.timerTitle}>Time Remaining</Text>
                  </View>
                  <View style={styles.timerGrid}>
                    <TimeBlock value={timeLeft.days} label="Days" />
                    <TimeBlock value={timeLeft.hours} label="Hours" />
                    <TimeBlock value={timeLeft.minutes} label="Minutes" />
                    <TimeBlock value={timeLeft.seconds} label="Seconds" />
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <View style={styles.cardHeader}>
                    <FontAwesome5 name="info-circle" size={18} color="#4F46E5" />
                    <Text style={styles.cardTitle}>Appointment Info</Text>
                  </View>

                  <DetailRow
                    icon={<FontAwesome5 name="store" size={16} color="#4F46E5" />}
                    title="Salon"
                    value={bookingData?.shopDetails?.ShopName || '—'}
                  />
                  <DetailRow
                    icon={<Ionicons name="location" size={16} color="#4F46E5" />}
                    title="City"
                    value={bookingData?.shopDetails?.City || '—'}
                  />
                  <DetailRow
                    icon={<Ionicons name="location-outline" size={16} color="#4F46E5" />}
                    title="Location"
                    value={bookingData?.shopDetails?.ExactLocation || '—'}
                  />
                  <DetailRow
                    icon={<FontAwesome5 name="cut" size={16} color="#4F46E5" />}
                    title="Services"
                    value={
                      bookingData?.services?.length > 0
                        ? bookingData.services.map((s: any) => `${s.name} (₹${s.price || '?'})`).join(', ')
                        : 'N/A'
                    }
                  />
                  <DetailRow
                    icon={<FontAwesome5 name="rupee-sign" size={16} color="#4F46E5" />}
                    title="Total Amount"
                    value={`₹${bookingData?.totalPrice || 0}`}
                  />
                  <DetailRow
                    icon={<FontAwesome5 name="user" size={16} color="#4F46E5" />}
                    title="Barber"
                    value={bookingData?.barber?.name || 'Any Barber'}
                  />
                  <DetailRow
                    icon={<Ionicons name="calendar" size={16} color="#4F46E5" />}
                    title="Date"
                    value={formatDisplayDate()}
                  />
                  <DetailRow
                    icon={<Ionicons name="time" size={16} color="#4F46E5" />}
                    title="Time (IST)"
                    value={formatDisplayTime()}
                  />
                  <DetailRow
                    icon={<MaterialIcons name="confirmation-number" size={16} color="#4F46E5" />}
                    title="Booking ID"
                    value={bookingData?._id?.slice(-8).toUpperCase() || '—'}
                  />
                  <DetailRow
                    icon={<MaterialIcons name="info" size={16} color="#4F46E5" />}
                    title="Status"
                    value={bookingData?.bookingStatus?.toUpperCase() || 'UNKNOWN'}
                  />
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={[styles.actionButton, styles.primaryBtn]}>
                    <Ionicons name="time" size={20} color="white" />
                    <Text style={styles.primaryBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryBtn]}>
                    <Ionicons name="navigate" size={20} color="#4F46E5" />
                    <Text style={styles.secondaryBtnText}>Directions</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.remindersCard}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="notifications-active" size={18} color="#DC2626" />
                    <Text style={styles.cardTitle}>Important Reminders</Text>
                  </View>
                  <ReminderItem text="Please arrive 10 minutes early" />
                  <ReminderItem text="Bring your booking confirmation" />
                  <ReminderItem text="Cancel at least 24 hours in advance to avoid fees" />
                </View>

                <View style={styles.helpCard}>
                  <FontAwesome5 name="question-circle" size={32} color="#4F46E5" />
                  <View style={styles.helpContent}>
                    <Text style={styles.helpTitle}>Need Help?</Text>
                    <Text style={styles.helpText}>Contact us for any changes or questions</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────
// Reusable Components (unchanged)
// ────────────────────────────────────────────────

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.timeBlock}>
    <View style={styles.timeValueContainer}>
      <Text style={styles.timeValue}>{String(value || 0).padStart(2, '0')}</Text>
    </View>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

const DetailRow = ({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  subtitle?: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <View style={styles.detailContent}>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
      {subtitle && <Text style={styles.detailSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const ReminderItem = ({ text }: { text: string }) => (
  <View style={styles.reminderItem}>
    <View style={styles.reminderBullet} />
    <Text style={styles.reminderText}>{text}</Text>
  </View>
);

// Styles (unchanged)
const styles = StyleSheet.create({
  fixedBottomWidget: {
    position: 'absolute',
    bottom: '15%',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  widgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    minHeight: 56,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  clockIconContainer: { position: 'relative', marginRight: 10 },
  clockIcon: {
    width: 34,
    height: 34,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeContainer: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '900' },
  timeInfo: { flex: 1 },
  widgetTitle: { fontSize: 8, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  countdownContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  countdownItem: { alignItems: 'center', minWidth: 24 },
  countdownNumber: { fontSize: 13, fontWeight: '900', color: '#111827', marginBottom: 1 },
  countdownLabel: { fontSize: 7, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  countdownSeparator: { fontSize: 12, fontWeight: '700', color: '#D1D5DB', marginHorizontal: 2 },
  shopName: { fontSize: 10, fontWeight: '600', color: '#4B5563' },
  viewButtonContainer: { marginLeft: 10 },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shimmerOverlay: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  shimmer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.2)', transform: [{ skewX: '-20deg' }] },
  viewButtonText: { color: 'white', fontSize: 11, fontWeight: '700', marginRight: 3, letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20 },
  modalContent: { paddingTop: 20, paddingHorizontal: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  scrollContent: { paddingBottom: 24, paddingHorizontal: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  timerCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginTop: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  timerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 8 },
  timerGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  timeBlock: { alignItems: 'center' },
  timeValueContainer: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, marginBottom: 8, minWidth: 60, alignItems: 'center' },
  timeValue: { fontSize: 24, fontWeight: '900', color: 'white' },
  timeLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailsCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginLeft: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  detailContent: { flex: 1 },
  detailTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2, lineHeight: 22 },
  detailSubtitle: { fontSize: 14, color: '#4B5563', fontWeight: '500', lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  primaryBtn: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: 'white', letterSpacing: 0.3 },
  secondaryBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.3 },
  remindersCard: { backgroundColor: '#FEF2F2', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  reminderItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  reminderBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626', marginTop: 8, marginRight: 12 },
  reminderText: { fontSize: 14, color: '#374151', flex: 1, lineHeight: 20, fontWeight: '500' },
  helpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  helpContent: { flex: 1, marginLeft: 12 },
  helpTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  helpText: { fontSize: 13, color: '#6B7280' },
});