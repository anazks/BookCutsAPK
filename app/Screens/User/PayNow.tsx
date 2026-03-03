import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { createOrder, verifyPayment } from '../../api/Service/Booking';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const PaymentOption = ({ title, amount, isSelected, onPress, note }) => (
  <TouchableOpacity
    style={[styles.paymentOption, isSelected && styles.selectedOption]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.optionLeft}>
      <View style={[styles.radioRing, isSelected && styles.radioRingSelected]}>
        {isSelected && <View style={styles.radioFill} />}
      </View>
    </View>
    <View style={styles.optionContent}>
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{title}</Text>
      <Text style={[styles.optionAmount, isSelected && styles.optionAmountSelected]}>₹{amount}</Text>
      {note && <Text style={styles.optionNote}>{note}</Text>}
    </View>
    {isSelected && (
      <View style={styles.selectedBadge}>
        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
      </View>
    )}
  </TouchableOpacity>
);

export default function PayNow() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [bookingData, setBookingData] = useState(null);
  const [paymentType, setPaymentType] = useState('full');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const {
    bookingData: bookingDataString,
    bookingId,
    barberName,
    bookingDate,
    timeSlot,
    totalPrice,
    advanceAmount,
    customerName = 'Customer',
    customerEmail = 'customer@example.com',
    customerPhone = '9999999999',
  } = params;

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        if (bookingDataString) {
          const parsedData = JSON.parse(bookingDataString);
          console.log('Parsed booking data:', parsedData);
          setBookingData(parsedData);
        }
      } catch (error) {
        console.error('Error parsing booking data:', error);
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [bookingDataString, router]);

  const getBookingId = () => {
    if (bookingId) return bookingId;
    if (bookingData?._id) return bookingData._id;
    return null;
  };

  const handlePaymentSuccess = useCallback(
    async (paymentResponse) => {
      try {
        setIsProcessing(true);

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

        console.log('Payment successful, verifying with backend...', {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
        });

        const finalBookingId = getBookingId();
        if (!finalBookingId) throw new Error('Booking ID not found for verification');

        const email = await AsyncStorage.getItem('email');

        const verificationData = {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          bookingId: finalBookingId,
          paymentType,
          amount: paymentType === 'advance' ? advanceAmount : totalPrice,
          currency: 'INR',
          email,
        };

        console.log('Sending verification data:', verificationData);

        const verificationResponse = await verifyPayment(verificationData);

        if (verificationResponse.success) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Payment Successful 🎉',
              body: `₹${verificationData.amount} paid successfully.`,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              data: { type: 'payment_success', bookingId: finalBookingId },
            },
            trigger: null,
          });

          const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: '✂️ Haircut Reminder',
              body: `Don't forget your appointment with ${barberName} today at ${timeSlot}!`,
              sound: 'default',
              vibrationPattern: [0, 500, 500, 500],
              data: { type: 'haircut_reminder', bookingId: finalBookingId, barberName, timeSlot },
            },
            trigger: { date: fiveMinutesFromNow },
          });

          console.log(`Reminder scheduled for: ${fiveMinutesFromNow.toLocaleTimeString()}`);

          router.push({
            pathname: '/Screens/User/ConfirmBooking',
            params: {
              bookingId: finalBookingId,
              paymentId: razorpay_payment_id,
              paymentType,
              amount: paymentType === 'advance' ? advanceAmount : totalPrice,
              verified: 'true',
              barberName,
              bookingDate,
              timeSlot,
              reminderScheduled: 'true',
            },
          });
        } else {
          throw new Error(verificationResponse.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        Alert.alert(
          'Payment Failed',
          error.message || 'Your payment was processed but verification failed. Please contact support.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [bookingData, paymentType, advanceAmount, totalPrice, router, barberName, timeSlot]
  );

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const amount =
        paymentType === 'advance' ? parseFloat(advanceAmount) : parseFloat(totalPrice);

      if (isNaN(amount)) throw new Error('Invalid payment amount');

      const finalBookingId = getBookingId();
      if (!finalBookingId) throw new Error('Booking ID not found for order creation');

      console.log('Creating order with booking ID:', finalBookingId);

      const orderResponse = await createOrder({
        amount,
        currency: 'INR',
        bookingId: finalBookingId,
        paymentType,
        services: bookingData?.services,
        customerDetails: { name: customerName, email: customerEmail, phone: customerPhone },
      });

      if (!orderResponse?.id) throw new Error(orderResponse?.message || 'Failed to create payment order');

      setCurrentOrderId(orderResponse.id);

      const options = {
        name: 'BookmyCuts',
        description: `Booking Payment (${paymentType === 'advance' ? 'Advance' : 'Full'})`,
        order_id: orderResponse.id,
        key: 'rzp_test_fccR1aGiSJLS1e',
        amount: Math.round(amount * 100),
        currency: 'INR',
        prefill: { name: customerName, email: customerEmail, contact: customerPhone },
        theme: { color: '#1877F2' },
        notes: {
          bookingId: finalBookingId,
          paymentType,
          services: bookingData?.services.map((s) => s.name).join(', '),
        },
      };

      console.log('Opening Razorpay checkout with options:', options);

      RazorpayCheckout.open(options)
        .then(handlePaymentSuccess)
        .catch((error) => {
          console.error('Razorpay error:', error);
          setIsProcessing(false);

          if (error.code === 0) {
            Alert.alert('Payment Status', 'Payment completed. Verifying...');
          } else if (error.code === 1) {
            Alert.alert('Payment Failed', error.description || 'Payment could not be completed');
          } else if (error.code === 2) {
            console.log('Payment cancelled by user');
          } else {
            Alert.alert('Payment Error', error.description || 'An error occurred during payment');
          }
        });
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  if (isLoading || !bookingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  const remainingAmount = (parseFloat(totalPrice) - parseFloat(advanceAmount)).toFixed(2);
  const buttonText =
    paymentType === 'advance' ? `Pay ₹${advanceAmount} Now` : `Pay ₹${totalPrice} Now`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF4FF' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Title ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Checkout</Text>
          <Text style={styles.pageSubtitle}>Review & complete your booking</Text>
        </View>

        {/* ── Booking Summary Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="calendar-outline" size={18} color="#1877F2" />
            </View>
            <Text style={styles.cardTitle}>Booking Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <DetailRow label="Barber" value={barberName} />
            <DetailRow label="Date" value={bookingDate} />
            <DetailRow label="Time Slot" value={timeSlot} />
            <DetailRow
              label="Services"
              value={bookingData.services.map((s) => s.name).join(', ')}
            />
            <DetailRow label="Duration" value={`${bookingData.totalDuration} minutes`} />

            {/* Total row */}
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalAmountLabel}>Total Amount</Text>
              <View style={styles.totalAmountBadge}>
                <Text style={styles.totalAmountValue}>₹{totalPrice}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Payment Options Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="wallet-outline" size={18} color="#1877F2" />
            </View>
            <Text style={styles.cardTitle}>Payment Options</Text>
          </View>

          <View style={styles.optionsContainer}>
            <PaymentOption
              title="Pay Full Amount"
              amount={totalPrice}
              isSelected={paymentType === 'full'}
              onPress={() => setPaymentType('full')}
            />
            <PaymentOption
              title="Pay Advance Booking Fee"
              amount={advanceAmount}
              isSelected={paymentType === 'advance'}
              onPress={() => setPaymentType('advance')}
              note={`Remaining ₹${remainingAmount} to be paid at salon`}
            />
          </View>
        </View>

        {/* ── Pay Button ── */}
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.disabledButton]}
          onPress={handlePayment}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.payButtonInner}>
              <Text style={styles.payButtonText}>{buttonText}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.secureNote}>
          <Ionicons name="lock-closed-outline" size={12} color="#94A3B8" /> Secured by Razorpay
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#EEF4FF',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#1877F2',
    fontWeight: '500',
  },

  /* ── Page Header ── */
  pageHeader: {
    marginBottom: 20,
    paddingTop: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1877F2',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4FF',
    backgroundColor: '#F8FBFF',
    gap: 10,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1877F2',
  },

  /* ── Details ── */
  detailsContainer: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
    maxWidth: '60%',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  totalAmountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalAmountBadge: {
    backgroundColor: '#1877F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Payment Options ── */
  optionsContainer: {
    padding: 16,
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#F8FBFF',
    gap: 12,
  },
  selectedOption: {
    borderColor: '#1877F2',
    backgroundColor: '#EEF4FF',
  },
  optionLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingSelected: {
    borderColor: '#1877F2',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1877F2',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  optionTextSelected: {
    color: '#1877F2',
  },
  optionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  optionAmountSelected: {
    color: '#1877F2',
  },
  optionNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Pay Button ── */
  payButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0D4FB5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.1,
  },
  payButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secureNote: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});