import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

export default function Payment({ route }) {
  const { amount = 0, bookingId = '' } =  {};
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  // Payment methods with image URLs
  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Pay securely with UPI, Cards, Net Banking',
      icon: 'https://cdn.razorpay.com/logos/razorpay_logo.png'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      description: 'Pay from your wallet balance',
      icon: 'https://cdn-icons-png.flaticon.com/512/2589/2589148.png',
      disabled: true
    },
    {
      id: 'paylater',
      name: 'Pay Later',
      description: 'Get credit and pay within 14 days',
      icon: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
      disabled: true
    }
  ];

  const initiateRazorpayPayment = () => {
    setLoading(true);
    
    const options = {
      description: 'Booking Payment',
      image: 'https://your-app-logo-url.com/logo.png', // Replace with your app logo
      currency: 'INR',
      key: 'rzp_test_YOUR_API_KEY', // Replace with your Razorpay API Key
      amount: amount * 100, // Convert to paise
      name: 'Your App Name',
      prefill: {
        email: 'user@example.com',
        contact: '9999999999',
        name: 'User Name'
      },
      theme: { color: '#FF6B6B' },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        console.log('Payment Success:', data);
        setLoading(false);
        // Add your success logic here (e.g., navigation to success screen)
      })
      .catch((error) => {
        console.log('Payment Error:', error);
        setLoading(false);
        // Add your error handling logic here
      });
  };

  const handlePayment = () => {
    if (selectedMethod === 'razorpay') {
      initiateRazorpayPayment();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF6B6B" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking ID:</Text>
            <Text style={styles.summaryValue}>{bookingId || 'N/A'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Pay:</Text>
            <Text style={[styles.summaryValue, styles.amountText]}>₹{amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={[styles.summaryValue, styles.totalAmount]}>₹{amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity 
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedMethod,
                method.disabled && styles.disabledMethod
              ]}
              onPress={() => !method.disabled && setSelectedMethod(method.id)}
              disabled={method.disabled}
            >
              <Image 
                source={{ uri: method.icon }} 
                style={styles.methodIcon} 
                resizeMode="contain"
                onError={() => console.log('Error loading image')}
              />
              
              <View style={styles.methodInfo}>
                <Text style={[
                  styles.methodName,
                  selectedMethod === method.id && styles.selectedMethodText,
                  method.disabled && styles.disabledText
                ]}>
                  {method.name}
                </Text>
                <Text style={[styles.methodDescription, method.disabled && styles.disabledText]}>
                  {method.description}
                </Text>
              </View>
              
              <View style={[
                styles.radioOuter,
                selectedMethod === method.id && styles.radioOuterSelected,
                method.disabled && styles.disabledRadio
              ]}>
                {selectedMethod === method.id && !method.disabled && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Security Info */}
        <View style={styles.securityInfo}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2889/2889676.png' }} 
            style={styles.securityIcon} 
            resizeMode="contain"
          />
          <Text style={styles.securityText}>
            Your payment is secured with 128-bit encryption
          </Text>
        </View>
      </ScrollView>

      {/* Payment Button */}
      {/* <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay ₹{amount.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600'
  },
  content: {
    padding: 20,
    paddingBottom: 80
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  amountText: {
    fontWeight: '600'
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 16
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  selectedMethod: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5'
  },
  disabledMethod: {
    opacity: 0.6
  },
  methodIcon: {
    width: 40,
    height: 40,
    marginRight: 16
  },
  methodInfo: {
    flex: 1
  },
  methodName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  selectedMethodText: {
    color: '#FF6B6B'
  },
  disabledText: {
    color: '#999'
  },
  methodDescription: {
    fontSize: 12,
    color: '#888'
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioOuterSelected: {
    borderColor: '#FF6B6B'
  },
  disabledRadio: {
    borderColor: '#EEE'
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B'
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  securityIcon: {
    width: 16,
    height: 16,
    marginRight: 8
  },
  securityText: {
    fontSize: 12,
    color: '#888'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  payButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledButton: {
    opacity: 0.7
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});