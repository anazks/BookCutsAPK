import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Logo from '../assets/images/logo.png';

const { width, height } = Dimensions.get('window');

export default function BookMyCutsHome() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current; // Start smaller for a bigger "pop" effect

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ABSTRACT BACKGROUND SHAPES */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020617' }]} />
        
        <LinearGradient
          colors={['#1E3A8A', 'transparent']}
          style={[styles.shape, { top: -100, right: -50, width: 350, height: 350, borderRadius: 175, opacity: 0.25 }]}
        />
        
        <View 
          style={[styles.shape, { 
            bottom: height * 0.05, 
            left: -width * 0.3, 
            width: width * 1.2, 
            height: width * 1.2, 
            borderRadius: 200, 
            backgroundColor: '#0F172A',
            transform: [{ rotate: '-15deg' }],
            opacity: 0.5
          }]} 
        />
      </View>

      <SafeAreaView style={styles.wrapper}>
        
        {/* CENTERED LOGO - 2X VISUAL IMPACT */}
        <View style={styles.centerSection}>
          <Animated.View style={[
            styles.logoWrap, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: logoScale }] 
            }
          ]}>
            <Image 
              source={Logo} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </Animated.View>
        </View>

        {/* CONTENT BOTTOM */}
        <Animated.View style={[styles.footerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.textContainer}>
            <Text style={styles.headline}>
              Your Style,{"\n"}
              <Text style={styles.boldText}>On Your Time.</Text>
            </Text>
            
            <Text style={styles.description}>
              The premium way to discover and book professional barbers in your area.
            </Text>
          </View>

          {/* QUICK STATS */}
          <View style={styles.statRow}>
            <View style={styles.miniStat}>
              <Text style={styles.statValue}>50k+</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.statValue}>4.9/5</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/Screens/User/Login')}
            style={styles.ctaContainer}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mainButton}
            >
              <Text style={styles.buttonText}>Explore Local Shops</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Join the community of 500+ premium barbers
          </Text>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shape: { position: 'absolute' },
  wrapper: { flex: 1 },
  
  centerSection: {
    flex: 1.2, // Increased flex to give the logo more room
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: width * 1.1, // Oversized width to ensure image can scale up
    height: height * 0.4, // Significant height increase for the "2x" look
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '90%', // Larger internal percentage
    height: '90%',
  },

  footerSection: {
    paddingHorizontal: 30,
    paddingBottom: 30,
    justifyContent: 'flex-end',
  },
  textContainer: {
    marginBottom: 10,
  },
  headline: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  boldText: {
    fontWeight: '900',
    color: '#3B82F6',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    lineHeight: 22,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniStat: { alignItems: 'center', paddingHorizontal: 15 },
  statValue: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 15, backgroundColor: 'rgba(255,255,255,0.1)' },

  ctaContainer: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  mainButton: {
    height: 62,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  }
});