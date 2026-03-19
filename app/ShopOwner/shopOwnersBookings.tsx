import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import Bookings from '../Components/Shop/Bookings';

export default function ShopOwnersBookings() {
  return (
    <View style={styles.safeArea}>
      <Bookings />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8', // matches Bookings background
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
