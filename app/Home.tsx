import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import your logo - make sure the path is correct
import Logo from '../assets/images/logo.png';

export default function GetStartedScreen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
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
      {/* Centered Logo Container */}
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Image 
            source={Logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom Button Section */}
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
            <MaterialIcons name="arrow-forward" size={24} color="#FF6B6B" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: '90%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 220,
  },
  buttonText: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
    letterSpacing: 0.5,
  },
  partnerText: {
    marginTop: 24,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
});