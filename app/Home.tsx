import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Logo from '../assets/images/logo.png';

const { width, height } = Dimensions.get('window');

export default function BookMyCutsHome() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(25)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.contentWrapper}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.premiumText}>FIND • BOOK • SKIP THE LINE</Text>
        </Animated.View>

        {/* Hero Logo Section - Large as requested */}
        <View style={styles.heroSection}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        <View style={styles.mainContainer}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
            <Text style={styles.headline}>Your City's Best{'\n'}Barbers, in One App.</Text>
            
            {/* Visual Search Bar - Explains the Marketplace Idea Instantly */}
            <View style={styles.searchMock}>
              <Ionicons name="search" size={20} color="rgba(212, 175, 55, 0.6)" />
              <Text style={styles.searchPlaceholder}>Search shops or styles...</Text>
            </View>

            <Text style={styles.subheadline}>
              Select your favorite shop, pick a stylist, and book your slot. No more waiting in queues.
            </Text>
          </Animated.View>

          {/* Aggregator Metrics */}
          <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
            <View style={styles.statBox}>
              <Ionicons name="location-outline" size={18} color="#D4AF37" />
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Shops</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={18} color="#D4AF37" />
              <Text style={styles.statValue}>1.2k</Text>
              <Text style={styles.statLabel}>Barbers</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={18} color="#D4AF37" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Waiting</Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.push('/Screens/User/Login')}
            style={styles.touchable}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <LinearGradient
                colors={['#D4AF37', '#B8860B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>EXPLORE SHOPS</Text>
                <MaterialIcons name="near-me" size={20} color="black" />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.footerLegal}>SUPPORTING LOCAL BARBERS SINCE 2024</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  contentWrapper: { flex: 1, paddingHorizontal: 25, justifyContent: 'space-between', paddingVertical: 30 },
  header: { alignItems: 'center', marginTop: 10 },
  premiumText: { color: 'rgba(212, 175, 55, 0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 3 },
  heroSection: { width: '100%', height: height * 0.28, justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: '100%', height: '100%' },
  mainContainer: { flex: 1, justifyContent: 'center', marginTop: -10 },
  headline: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 20 },
  
  // New Marketplace Element: Mock Search Bar
  searchMock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 20,
    marginHorizontal: 10
  },
  searchPlaceholder: { color: 'rgba(255,255,255,0.4)', marginLeft: 10, fontSize: 14 },

  subheadline: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 15 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 30
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  statLabel: { color: '#D4AF37', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  footer: { alignItems: 'center', gap: 20 },
  touchable: { width: '100%' },
  ctaButton: { height: 65, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  footerLegal: { color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: 1, fontWeight: '600' },
});