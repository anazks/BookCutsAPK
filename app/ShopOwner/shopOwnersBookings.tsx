import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Bookings from '../Components/Shop/Bookings';

export default function ShopOwnersBookings() {  // Fixed component name to PascalCase
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>My Bookings</Text>
      </View>
      
      <View style={styles.bookingsContainer}>
        <Bookings />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 20, // Adds padding at the bottom for better scrolling
  },
  header: {
    padding: 16,
    paddingBottom: 8, // Reduced bottom padding for tighter layout
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingsContainer: {
    paddingHorizontal: 16, // Added horizontal padding for better spacing
  },
});