import React from 'react';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Support() {
  const contactNumbers = [
    { id: 1, number: '8606414384', label: 'Customer Support' },
    { id: 2, number: '6378491959', label: 'Booking Assistance' }
  ];

  const email = 'support@bookmycuts.com';

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email}?subject=BookMyCuts Support`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF6B6B" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <View style={styles.contactCard}>
            <Icon name="phone" size={24} color="#FF6B6B" style={styles.icon} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Call Us</Text>
              {contactNumbers.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.contactItem}
                  onPress={() => handleCall(item.number)}
                >
                  <Text style={styles.contactText}>{item.label}:</Text>
                  <Text style={styles.contactValue}>{item.number}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.contactCard}>
            <Icon name="email" size={24} color="#FF6B6B" style={styles.icon} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Us</Text>
              <TouchableOpacity onPress={handleEmail}>
                <Text style={styles.contactValue}>{email}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I book an appointment?</Text>
            <Text style={styles.faqAnswer}>
              Go to the 'Book Now' section, select your preferred barber, service, date and time slot.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel my booking?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can cancel up to 2 hours before your appointment time from the 'My Bookings' section.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods are accepted?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit/debit cards, UPI, and net banking through Razorpay.
            </Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            1. Appointments must be cancelled at least 2 hours in advance to avoid charges.
          </Text>
          <Text style={styles.termsText}>
            2. Late arrivals may result in reduced service time or cancellation.
          </Text>
          <Text style={styles.termsText}>
            3. Refunds will be processed within 5-7 business days.
          </Text>
          <Text style={styles.termsText}>
            4. BookMyCuts is not responsible for service quality at partner salons.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 30
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 15
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  icon: {
    marginRight: 15
  },
  contactInfo: {
    flex: 1
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10
  },
  contactItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5
  },
  contactValue: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500'
  },
  faqItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20
  }
});