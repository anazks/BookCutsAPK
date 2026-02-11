import { fetchUpcomingBooking } from '@/app/api/Service/User';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BookingReminder() {
  const [bookingData, setBookingData] = useState<any>(null);
  const [timeLeft, setTimeLeft]       = useState<any>(null);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [modalVisible, setModalVisible]   = useState(false);

  // Widget entrance
  const slideInAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim  = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  // Modal
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
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
    const s = getStartTimeDate();
    if (!s || bookingData?.bookingStatus === 'cancelled') return null;
    const diff = s.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  const openModal = () => {
    setModalVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(SCREEN_HEIGHT);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.ease }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 100 }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const formatDisplayDate = () => { const s = getStartTimeDate(); return s ? dateFormatter.format(s) : '—'; };
  const formatDisplayTime = () => {
    const s = getStartTimeDate(); const e = getEndTimeDate();
    if (!s || !e) return '—';
    return `${timeFormatter.format(s)} – ${timeFormatter.format(e)}`;
  };

  // ── Fetch ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        const res = await fetchUpcomingBooking(userId);
        if (res?.success && res?.booking) {
          setBookingData({ ...res.booking, shopDetails: res.shopDetails || null });
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Timer + visibility ────────────────────────────────
  useEffect(() => {
    if (!bookingData) { setWidgetVisible(false); return; }

    let entered = false;
    const update = () => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);
      const end = getEndTimeDate();
      const show = !!end && Date.now() < end.getTime() && tl !== null;
      setWidgetVisible(show);

      if (show && !entered) {
        entered = true;
        Animated.parallel([
          Animated.spring(slideInAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 80 }),
          Animated.timing(opacityAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
      }
    };

    update();
    const timer = setInterval(update, 1000);

    // Shimmer sweep on VIEW button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();

    // Badge pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 600,  useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600,  useNativeDriver: true }),
        Animated.delay(1800),
      ])
    ).start();

    // Periodic micro-bounce
    const bInterval = setInterval(() => {
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.015, useNativeDriver: true, bounciness: 8 }),
        Animated.spring(bounceAnim, { toValue: 1,     useNativeDriver: true, bounciness: 8 }),
      ]).start();
    }, 8000);

    return () => { clearInterval(timer); clearInterval(bInterval); };
  }, [bookingData]);

  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 220] });

  if (!widgetVisible || !timeLeft) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════════
          FLOATING WIDGET
      ══════════════════════════════════════════════════ */}
      <Animated.View
        style={{
          marginHorizontal: 20,
          marginBottom: 8,
          opacity: opacityAnim,
          transform: [{ translateY: slideInAnim }, { scale: bounceAnim }],
        }}
      >
        <TouchableOpacity activeOpacity={0.92} onPress={openModal}>
          {/* Gold gradient border ring */}
          <LinearGradient
            colors={['rgba(212,175,55,0.75)', 'rgba(212,175,55,0.2)', 'rgba(212,175,55,0.75)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowRing}
          >
            <View style={styles.widgetBody}>
              {/* Clock icon */}
              <View style={{ position: 'relative' }}>
                <LinearGradient colors={['#D4AF37', '#A0832A']} style={styles.clockIcon}>
                  <Ionicons name="time" size={18} color="#0A0A0A" />
                </LinearGradient>
                <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.badgeText}>!</Text>
                </Animated.View>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.widgetLabel}>UPCOMING APPOINTMENT</Text>
                <View style={styles.countdownRow}>
                  <CountUnit value={timeLeft.days}    sub="D" />
                  <Text style={styles.colon}>:</Text>
                  <CountUnit value={timeLeft.hours}   sub="H" />
                  <Text style={styles.colon}>:</Text>
                  <CountUnit value={timeLeft.minutes} sub="M" />
                </View>
                <Text style={styles.shopName} numberOfLines={1}>
                  {bookingData?.shopDetails?.ShopName || 'Salon'}
                </Text>
              </View>

              {/* VIEW button */}
              <LinearGradient colors={['#D4AF37', '#B8941E']} style={styles.viewBtn}>
                <Animated.View
                  style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { skewX: '-15deg' }] }]}
                />
                <Text style={styles.viewBtnText}>VIEW</Text>
                <Feather name="arrow-right" size={11} color="#0A0A0A" />
              </LinearGradient>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ══════════════════════════════════════════════════
          BOTTOM SHEET MODAL
      ══════════════════════════════════════════════════ */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient colors={['#D4AF37', '#A0832A']} style={styles.sheetHeaderIcon}>
                <Ionicons name="calendar" size={19} color="#0A0A0A" />
              </LinearGradient>
              <View>
                <Text style={styles.sheetTitle}>Appointment Details</Text>
                <Text style={styles.sheetSub}>Your upcoming booking</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>

            {/* Countdown */}
            <View style={styles.timerCard}>
              <View style={styles.cardRow}>
                <Ionicons name="time-outline" size={15} color="#D4AF37" />
                <Text style={styles.cardTitle}>Time Remaining</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ModalTimeBlock value={timeLeft.days}    label="Days" />
                <Text style={styles.timerColon}>:</Text>
                <ModalTimeBlock value={timeLeft.hours}   label="Hours" />
                <Text style={styles.timerColon}>:</Text>
                <ModalTimeBlock value={timeLeft.minutes} label="Min" />
                <Text style={styles.timerColon}>:</Text>
                <ModalTimeBlock value={timeLeft.seconds} label="Sec" />
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailCard}>
              <View style={styles.cardRow}>
                <FontAwesome5 name="info-circle" size={14} color="#D4AF37" />
                <Text style={styles.cardTitle}>Appointment Info</Text>
              </View>
              <DetailRow icon="storefront-outline"      label="Salon"      value={bookingData?.shopDetails?.ShopName || '—'} />
              <DetailRow icon="location-outline"        label="City"       value={bookingData?.shopDetails?.City || '—'} />
              <DetailRow icon="map-outline"             label="Location"   value={bookingData?.shopDetails?.ExactLocation || '—'} />
              <DetailRow icon="cut-outline"             label="Services"   value={bookingData?.services?.length > 0 ? bookingData.services.map((s: any) => `${s.name} (₹${s.price || '?'})`).join(', ') : 'N/A'} />
              <DetailRow icon="cash-outline"            label="Total"      value={`₹${bookingData?.totalPrice || 0}`} />
              <DetailRow icon="person-outline"          label="Barber"     value={bookingData?.barber?.name || 'Any Barber'} />
              <DetailRow icon="calendar-outline"        label="Date"       value={formatDisplayDate()} />
              <DetailRow icon="time-outline"            label="Time (IST)" value={formatDisplayTime()} />
              <DetailRow icon="receipt-outline"         label="Booking ID" value={bookingData?._id?.slice(-8).toUpperCase() || '—'} />
              <DetailRow icon="checkmark-circle-outline" label="Status"   value={bookingData?.bookingStatus?.toUpperCase() || 'UNKNOWN'} last />
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              <TouchableOpacity style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient colors={['#D4AF37', '#B8941E']} style={styles.primaryAction}>
                  <Ionicons name="time-outline" size={17} color="#0A0A0A" />
                  <Text style={styles.primaryActionText}>Reschedule</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction}>
                <Ionicons name="navigate-outline" size={17} color="#D4AF37" />
                <Text style={styles.secondaryActionText}>Directions</Text>
              </TouchableOpacity>
            </View>

            {/* Reminders */}
            <View style={styles.remindCard}>
              <View style={styles.cardRow}>
                <MaterialIcons name="notifications-active" size={15} color="#D4AF37" />
                <Text style={styles.cardTitle}>Reminders</Text>
              </View>
              <ReminderItem text="Please arrive 10 minutes early" />
              <ReminderItem text="Bring your booking confirmation" />
              <ReminderItem text="Cancel at least 24 hours in advance to avoid fees" />
            </View>

            {/* Help */}
            <View style={styles.helpCard}>
              <View style={styles.helpIcon}>
                <Ionicons name="help-circle-outline" size={24} color="#D4AF37" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpText}>Contact us for any changes or questions</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}

// ── Micro components ──────────────────────────────────────

const CountUnit = ({ value, sub }: { value: number; sub: string }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={styles.countNum}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.countSub}>{sub}</Text>
  </View>
);

const ModalTimeBlock = ({ value, label }: { value: number; label: string }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={styles.timeBox}>
      <Text style={styles.timeBoxNum}>{String(value || 0).padStart(2, '0')}</Text>
    </View>
    <Text style={styles.timeBoxLbl}>{label}</Text>
  </View>
);

const DetailRow = ({ icon, label, value, last }: { icon: string; label: string; value?: string; last?: boolean }) => (
  <View style={[styles.detailRow, last && { borderBottomWidth: 0 }]}>
    <View style={styles.detailIconBox}>
      <Ionicons name={icon as any} size={14} color="#D4AF37" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const ReminderItem = ({ text }: { text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
    <View style={styles.remindDot} />
    <Text style={styles.remindText}>{text}</Text>
  </View>
);

// ── StyleSheet ────────────────────────────────────────────

const styles = StyleSheet.create({
  // Widget
  glowRing:   { borderRadius: 16, padding: 1.5 },
  widgetBody: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1A14',    // warm charcoal — pops on #0A0A0A
    borderRadius: 15,
    paddingVertical: 11, paddingHorizontal: 14, gap: 12,
  },
  clockIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1C1A14',
  },
  badgeText:    { color: '#fff', fontSize: 8, fontWeight: '900' },
  widgetLabel:  { fontSize: 7, fontWeight: '800', letterSpacing: 1.3, color: 'rgba(212,175,55,0.75)', marginBottom: 3 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  countNum:     { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  countSub:     { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5 },
  colon:        { fontSize: 13, fontWeight: '700', color: '#D4AF37', marginBottom: 6 },
  shopName:     { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 10,
    borderRadius: 10, gap: 4, overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0,
    width: 45, backgroundColor: 'rgba(255,255,255,0.28)',
  },
  viewBtnText: { fontSize: 11, fontWeight: '800', color: '#0A0A0A', letterSpacing: 0.6 },

  // Modal
  backdrop: { backgroundColor: 'rgba(0,0,0,0.78)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#141414',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%',
    borderTopWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2, shadowRadius: 20,
    elevation: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(212,175,55,0.45)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.15)',
  },
  sheetHeaderIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  sheetSub:   { fontSize: 10, color: 'rgba(212,175,55,0.7)', marginTop: 1, letterSpacing: 0.6 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Timer card
  timerCard: {
    backgroundColor: 'rgba(212,175,55,0.07)',
    borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)',
  },
  cardRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  timerColon: { fontSize: 20, fontWeight: '700', color: '#D4AF37', marginBottom: 18 },
  timeBox: {
    backgroundColor: 'rgba(212,175,55,0.13)',
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 12, marginBottom: 5, minWidth: 50, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
  },
  timeBoxNum: { fontSize: 22, fontWeight: '900', color: '#D4AF37' },
  timeBoxLbl: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.42)', letterSpacing: 0.5 },

  // Detail card
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  detailIconBox: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(212,175,55,0.65)', letterSpacing: 0.8, marginBottom: 3 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', lineHeight: 19 },

  // Actions
  primaryAction: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 15, gap: 8,
  },
  primaryActionText:  { fontSize: 14, fontWeight: '800', color: '#0A0A0A', letterSpacing: 0.3 },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 15, borderRadius: 14, gap: 8,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
  },
  secondaryActionText: { fontSize: 14, fontWeight: '700', color: '#D4AF37', letterSpacing: 0.3 },

  // Reminders
  remindCard: {
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)',
  },
  remindDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D4AF37', marginTop: 8, marginRight: 12 },
  remindText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },

  // Help
  helpCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: 16, gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  helpIcon: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  helpTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  helpText:  { fontSize: 12, color: 'rgba(255,255,255,0.42)' },
});