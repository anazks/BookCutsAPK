import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { createOrder, verifyPayment } from '../../api/Service/Booking';

const DetailRow = ({ label, value, icon }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelContainer}>
      {icon && <Ionicons name={icon} size={16} color="#64748B" />}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const PaymentOption = ({ title, amount, isSelected, onPress, note, savings }) => (
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
      <View style={styles.optionHeader}>
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{title}</Text>
        <Text style={[styles.optionAmount, isSelected && styles.optionAmountSelected]}>₹{amount}</Text>
      </View>

      {note && (
        <View style={styles.optionNoteContainer}>
          <Ionicons name="information-circle-outline" size={14} color="#64748B" />
          <Text style={styles.optionNote}>{note}</Text>
        </View>
      )}

      {savings && (
        <View style={styles.savingsBadge}>
          <Ionicons name="leaf-outline" size={12} color="#10B981" />
          <Text style={styles.savingsText}>Save ₹{savings} with advance</Text>
        </View>
      )}
    </View>

    {isSelected && (
      <View style={styles.selectedCheckmark}>
        <Ionicons name="checkmark-circle" size={22} color="#1877F2" />
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

        console.log(verificationResponse, "RESPONSE OF VERIFY PAYMENT")

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

      // Multiply amount by 100 to send in paise, in case backend expects paise
      const amountInPaise = Math.round(amount * 100);

      const orderResponse = await createOrder({
        amount: amountInPaise,
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
        key: 'rzp_live_SUY56QCdYmPx1Q',
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
        <LinearGradient
          colors={['#EEF4FF', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Getting your booking ready...</Text>
      </View>
    );
  }

  const remainingAmount = (parseFloat(totalPrice) - parseFloat(advanceAmount)).toFixed(2);
  const savingsAmount = (parseFloat(advanceAmount) * 0.05).toFixed(2); // Example: 5% savings
  const buttonText =
    paymentType === 'advance' ? `Pay ₹${advanceAmount} Now` : `Pay ₹${totalPrice} Now`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LinearGradient
        colors={['#EEF4FF', '#FFFFFF']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotCompleted]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.progressText}>Details</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Text style={styles.progressDotText}>2</Text>
            </View>
            <Text style={[styles.progressText, styles.progressTextActive]}>Payment</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot}>
              <Text style={styles.progressDotText}>3</Text>
            </View>
            <Text style={styles.progressText}>Confirm</Text>
          </View>
        </View>

        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="receipt-outline" size={20} color="#1877F2" />
            <Text style={styles.summaryTitle}>Booking Summary</Text>
          </View>

          <View style={styles.salonInfo}>
            <View style={styles.salonIconContainer}>
              <Ionicons name="cut" size={24} color="#1877F2" />
            </View>
            <View style={styles.salonDetails}>
              <Text style={styles.barberName}>{barberName}</Text>
              <Text style={styles.bookingDateTime}>{bookingDate} • {timeSlot}</Text>
            </View>
          </View>

          <View style={styles.servicesContainer}>
            {bookingData.services.map((service, index) => (
              <View key={index} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.durationText}>Total Duration: {bookingData.totalDuration} mins</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <View style={styles.totalAmountContainer}>
              <Text style={styles.totalAmount}>₹{totalPrice}</Text>
            </View>
          </View>
        </View>

        {/* Payment Options Card */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Ionicons name="wallet-outline" size={20} color="#1877F2" />
            <Text style={styles.paymentTitle}>Select Payment Method</Text>
          </View>

          <View style={styles.paymentOptions}>
            <PaymentOption
              title="Pay Full Amount"
              amount={totalPrice}
              isSelected={paymentType === 'full'}
              onPress={() => setPaymentType('full')}
              note="One-time payment"
            />

            <PaymentOption
              title="Pay Advance"
              amount={advanceAmount}
              isSelected={paymentType === 'advance'}
              onPress={() => setPaymentType('advance')}
              note={`Pay ₹${remainingAmount} at salon`}
              savings={savingsAmount}
            />
          </View>

          <View style={styles.paymentFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
              <Text style={styles.featureText}>Secure Payment</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed-outline" size={16} color="#10B981" />
              <Text style={styles.featureText}>Encrypted Transaction</Text>
            </View>
          </View>
        </View>

        {/* Coupon Section */}
        <TouchableOpacity style={styles.couponSection}>
          <View style={styles.couponLeft}>
            <Ionicons name="pricetag-outline" size={20} color="#1877F2" />
            <Text style={styles.couponText}>Apply Coupon</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Price Breakdown */}
        <View style={styles.priceBreakdownCard}>
          <Text style={styles.breakdownTitle}>Price Details</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{totalPrice}</Text>
          </View>

          {paymentType === 'advance' && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Pay at Salon</Text>
              <Text style={styles.breakdownValue}>₹{remainingAmount}</Text>
            </View>
          )}

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>GST</Text>
            <Text style={styles.breakdownValue}>Included</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownTotalRow}>
            <Text style={styles.breakdownTotalLabel}>Amount to Pay</Text>
            <Text style={styles.breakdownTotalValue}>
              ₹{paymentType === 'advance' ? advanceAmount : totalPrice}
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.disabledButton]}
          onPress={handlePayment}
          disabled={isProcessing}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isProcessing ? ['#93C5FD', '#1877F2'] : ['#1877F2', '#0D4FB5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButtonGradient}
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
          </LinearGradient>
        </TouchableOpacity>

        {/* Secure Payment Note */}
        <View style={styles.secureNoteContainer}>
          <Ionicons name="lock-closed" size={12} color="#94A3B8" />
          <Text style={styles.secureNoteText}>Secured by Razorpay</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#1877F2',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: '#1877F2',
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressTextActive: {
    color: '#1877F2',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#1877F2',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  salonInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  salonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  salonDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  barberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  bookingDateTime: {
    fontSize: 13,
    color: '#64748B',
  },
  servicesContainer: {
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 14,
    color: '#1E293B',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalAmountContainer: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1877F2',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  paymentOptions: {
    gap: 12,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F8FBFF',
  },
  selectedOption: {
    borderColor: '#1877F2',
    backgroundColor: '#EEF4FF',
  },
  optionLeft: {
    marginRight: 12,
    paddingTop: 2,
  },
  radioRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingSelected: {
    borderColor: '#1877F2',
  },
  radioFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1877F2',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#1877F2',
    fontWeight: '600',
  },
  optionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  optionAmountSelected: {
    color: '#1877F2',
  },
  optionNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionNote: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  selectedCheckmark: {
    marginLeft: 8,
  },
  paymentFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#64748B',
  },
  couponSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  priceBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1877F2',
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  payButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secureNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  secureNoteText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});