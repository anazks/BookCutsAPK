import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/assets/images/logo_black.png';

export default function BookMyCutsFooter() {
  return (
    <View style={styles.footerContainer}>
      <Image 
        source={Logo} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      <View style={styles.footerBottom}>
        <Text style={styles.footerText}>Made with </Text>
        <Ionicons name="heart" size={12} color="#ef4444" />
        <Text style={styles.footerText}> for easy bookings</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingTop: 30,
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 150,
    height: 40,
    tintColor: '#0f172a',
    marginBottom: 8,
  },
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});