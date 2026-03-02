import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Logo from '../assets/images/logo.png';

export default function GetStartedScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        delay: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered Logo Container */}
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            { opacity: fadeAnim }
          ]}
        >
          <Image 
            source={Logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            opacity: fadeAnim
          }}
        >
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={() => router.push('/Screens/User/Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <MaterialIcons name="arrow-forward" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.Text 
          style={[
            styles.partnerText,
            { opacity: fadeAnim }
          ]}
        >
          Join thousands of happy & secure customers
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1877F2',   // Facebook's iconic primary blue
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoWrapper: {
    width: '82%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    paddingBottom: 60,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#FFFFFF',           // white button pops on blue bg
    paddingVertical: 20,
    paddingHorizontal: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D4FB5',               // deeper blue shadow for depth
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    minWidth: 240,
    borderWidth: 0,
  },
  buttonText: {
    color: '#1877F2',                     // match the brand blue on white
    fontSize: 20,
    fontWeight: '700',
    marginRight: 14,
    letterSpacing: 0.4,
  },
  partnerText: {
    marginTop: 28,
    fontSize: 15,
    color: '#FFFFFF',                     // white text on blue bg — clean & clear
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.88,
  },
});