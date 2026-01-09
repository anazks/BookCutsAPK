import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock booking data
const BOOKING_DATA = {
  date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  shopName: 'Beauty Salon XYZ',
  service: 'Haircut & Styling',
  address: '123 Main Street, New York, NY',
  duration: '1 hour 30 minutes',
  price: '$85.00',
  stylist: 'Jessica Wilson',
  rating: '4.8',
  reviews: '124'
};

export default function BookingReminder() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // New animation for clock icon
  const clockScaleAnim = useRef(new Animated.Value(0.8)).current;

  function calculateTimeLeft() {
    const difference = BOOKING_DATA.date - new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const handlePress = () => {
    openModal();
  };

  const openModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clockScaleAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setModalVisible(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
      ]).start();
    });
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start(() => {
      setModalVisible(false);
      scaleAnim.setValue(0.8);
      clockScaleAnim.setValue(0.7);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
          bounciness: 12,
        }),
        Animated.spring(clockScaleAnim, {
          toValue: 0.8,
          useNativeDriver: true,
          bounciness: 12,
          delay: 100,
        })
      ]).start();
    });
  };

  const formatDate = () => {
    return BOOKING_DATA.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = () => {
    return BOOKING_DATA.date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        bounciness: 12,
        delay: 500,
      }),
      Animated.spring(clockScaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
        bounciness: 12,
        delay: 600,
      })
    ]).start();

    const bounceInterval = setInterval(() => {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.02,
          useNativeDriver: true,
          bounciness: 12,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 12,
        }),
      ]).start();
    }, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(bounceInterval);
    };
  }, []);

  return (
    <>
      {/* Simplified Fixed Bottom Widget - Reduced Width */}
      <Animated.View
        style={[
          styles.fixedBottomWidget,
          {
            transform: [{ scale: bounceAnim }]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
        >
          <Animated.View
            style={[
              styles.widgetContent,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.leftSection}>
              <Animated.View 
                style={[
                  styles.clockIconContainer,
                  {
                    transform: [{ scale: clockScaleAnim }]
                  }
                ]}
              >
                <View style={styles.clockIcon}>
                  <Ionicons name="time" size={16} color="white" />
                </View>
              </Animated.View>

              <View style={styles.timeInfo}>
                <Text style={styles.widgetTitle}>UPCOMING</Text>
                <View style={styles.countdownContainer}>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(timeLeft.days).padStart(2, '0')}</Text>
                    <Text style={styles.countdownLabel}>D</Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                    <Text style={styles.countdownLabel}>H</Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                    <Text style={styles.countdownLabel}>M</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* View Button */}
            <View style={styles.viewButtonContainer}>
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>VIEW</Text>
                <Feather name="arrow-right" size={10} color="white" />
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Simplified Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="calendar" size={20} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>Appointment Details</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Countdown Timer */}
                <View style={styles.timerCard}>
                  <Text style={styles.timerTitle}>Time Remaining</Text>
                  <View style={styles.timerGrid}>
                    <TimeBlock value={timeLeft.days} label="Days" />
                    <TimeBlock value={timeLeft.hours} label="Hours" />
                    <TimeBlock value={timeLeft.minutes} label="Minutes" />
                    <TimeBlock value={timeLeft.seconds} label="Seconds" />
                  </View>
                </View>

                {/* Appointment Details Card */}
                <View style={styles.detailsCard}>
                  <Text style={styles.cardTitle}>Details</Text>

                  <DetailRow
                    icon={<FontAwesome5 name="store" size={14} color="#4F46E5" />}
                    title="Salon"
                    value={BOOKING_DATA.shopName}
                    subtitle={`⭐ ${BOOKING_DATA.rating} (${BOOKING_DATA.reviews} reviews)`}
                  />
                  <DetailRow
                    icon={<Ionicons name="location" size={14} color="#4F46E5" />}
                    title="Address"
                    value={BOOKING_DATA.address}
                  />
                  <DetailRow
                    icon={<FontAwesome5 name="cut" size={14} color="#4F46E5" />}
                    title="Service"
                    value={BOOKING_DATA.service}
                    subtitle={`${BOOKING_DATA.duration} • ${BOOKING_DATA.price}`}
                  />
                  <DetailRow
                    icon={<FontAwesome5 name="user" size={14} color="#4F46E5" />}
                    title="Stylist"
                    value={BOOKING_DATA.stylist}
                  />
                  <DetailRow
                    icon={<Ionicons name="calendar" size={14} color="#4F46E5" />}
                    title="Date & Time"
                    value={`${formatDate()}`}
                    subtitle={formatTime()}
                  />
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="navigate" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Get Directions</Text>
                </TouchableOpacity>

                {/* Reminders Card */}
                <View style={styles.remindersCard}>
                  <Text style={styles.remindersTitle}>Reminders</Text>
                  <ReminderItem text="Please arrive 10 minutes early" />
                  <ReminderItem text="Bring your booking confirmation" />
                  <ReminderItem text="Cancel at least 24 hours in advance" />
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const TimeBlock = ({ value, label }) => (
  <View style={styles.timeBlock}>
    <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

const DetailRow = ({ icon, title, value, subtitle }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <View style={styles.detailContent}>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subtitle && <Text style={styles.detailSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const ReminderItem = ({ text }) => (
  <View style={styles.reminderItem}>
    <View style={styles.reminderBullet} />
    <Text style={styles.reminderText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  // Simplified Fixed Widget - Reduced Width
  fixedBottomWidget: {
    position: 'absolute',
    bottom: "12%",
    left: '21%', // Center the widget with less width
    right: '25%',
    zIndex: 1000,
  },
  widgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    // Simple shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clockIconContainer: {
    marginRight: 8,
  },
  clockIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 7,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownItem: {
    alignItems: 'center',
    minWidth: 20,
  },
  countdownNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 0,
  },
  countdownLabel: {
    fontSize: 6,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  countdownSeparator: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D1D5DB',
    marginHorizontal: 1,
  },
  viewButtonContainer: {
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 3,
    letterSpacing: 0.3,
  },

  // Modal Styles - Simplified
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalContent: {
    paddingTop: 16,
    paddingHorizontal: 0,
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cards - No Shadows
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  timerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 18,
  },
  
  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  
  // Reminders Card
  remindersCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    bottom:10,
    borderColor: '#F1F5F9',
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
    marginTop: 8,
    marginRight: 10,
  },
  reminderText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
});