import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ConfirmBooking() {
  const params = useLocalSearchParams();
  const { bookingId, paymentId, paymentType, amount, verified } = params;

  const handleExploreMore = () => {
    router.push('/(tabs)/Home');
  };

  const handleDownloadReceipt = () => {
    console.log('Download receipt for booking:', bookingId);
  };

  const handleViewDetails = () => {
    router.push({
      pathname: '/Screens/User/BookingDetails',
      params: { bookingId }
    });
  };

  const formatAmount = (amt) => {
    return `₹${parseFloat(amt || 0).toLocaleString('en-IN')}`;
  };

  const formatPaymentType = (type) => {
    return type === 'advance' ? 'Advance Payment' : 'Full Payment';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Success Message */}
      <View style={styles.successContainer}>
        <View style={styles.checkMark}>
          <Text style={styles.checkText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your payment has been processed successfully
        </Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>PAYMENT VERIFIED</Text>
        </View>

        {/* Payment Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment ID</Text>
            <Text style={styles.detailValue}>{paymentId || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Type</Text>
            <Text style={styles.detailValue}>{formatPaymentType(paymentType)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>{formatAmount(amount)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.successValue}>Completed</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{new Date().toLocaleDateString('en-IN')}</Text>
          </View>
        </View>

        {/* Booking ID */}
        <View style={styles.bookingIdContainer}>
          <Text style={styles.bookingIdLabel}>Booking ID</Text>
          <Text style={styles.bookingIdValue}>{bookingId || 'BK-2024-XXXX'}</Text>
        </View>

        {/* Payment Type Info */}
        {paymentType === 'advance' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Advance Payment</Text>
            <Text style={styles.infoText}>
              Remaining balance will be collected at the time of service.
            </Text>
          </View>
        )}

        {paymentType === 'full' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Full Payment Completed</Text>
            <Text style={styles.infoText}>
              Your booking is fully paid. No additional charges.
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleExploreMore}>
            <Text style={styles.primaryButtonText}>Explore More</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity style={styles.secondaryButton} onPress={handleDownloadReceipt}>
            <Text style={styles.secondaryButtonText}>Download Receipt</Text>
          </TouchableOpacity> */}
          
          <TouchableOpacity style={styles.linkButton} onPress={handleViewDetails}>
            <Text style={styles.linkButtonText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for choosing us!</Text>
          <Text style={styles.footerSubtext}>Confirmation email sent to your inbox</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  checkMark: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkText: {
    color: 'white',
    fontSize: 35,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusBanner: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  successValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  bookingIdContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingIdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  bookingIdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderColor: '#007bff',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkButtonText: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});