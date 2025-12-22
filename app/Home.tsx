import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import logo from '../assets/images/logo.png';
export default function GetStartedScreen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = new Animated.Value(0.8);
  const slideAnim = new Animated.Value(50);
  const buttonScale = new Animated.Value(0.9);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        delay: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background Pattern */}


      {/* Content Container */}
      <View style={styles.contentWrapper}>
        {/* Logo and Brand Section */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.logoIcon}>
              <Image source={logo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.tagline}>Your perfect cut awaits</Text>
          </Animated.View>
        </View>

        {/* Features Section */}
        <Animated.View 
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="schedule" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.featureText}>Book instantly</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="verified" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.featureText}>Trusted salons</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="stars" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.featureText}>Best experience</Text>
          </View>
        </Animated.View>

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
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.Text 
            style={[
              styles.partnerText,
              { opacity: fadeAnim }
            ]}
          >
            Join thousands of happy customers
          </Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: '#FF6B6B',
    top: -200,
    right: -150,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: '#FF6B6B',
    bottom: -100,
    left: -150,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: '#FF6B6B',
    top: '30%',
    left: -100,
  },
  circle4: {
    width: 150,
    height: 150,
    backgroundColor: '#FF6B6B',
    bottom: '35%',
    right: -75,
  },
  circle5: {
    width: 100,
    height: 100,
    backgroundColor: '#FF6B6B',
    top: '60%',
    right: 40,
  },
  line: {
    position: 'absolute',
    backgroundColor: '#FF6B6B',
    opacity: 0.05,
  },
  line1: {
    width: 2,
    height: 200,
    top: 100,
    left: '25%',
    transform: [{ rotate: '15deg' }],
  },
  line2: {
    width: 2,
    height: 150,
    bottom: 150,
    right: '30%',
    transform: [{ rotate: '-20deg' }],
  },
  line3: {
    width: 2,
    height: 180,
    top: '40%',
    right: '15%',
    transform: [{ rotate: '25deg' }],
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 250,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1.5,
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 40,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  featureText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 220,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
    letterSpacing: 0.5,
  },
  partnerText: {
    marginTop: 24,
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
});