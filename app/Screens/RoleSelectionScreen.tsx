import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import Customer from '../../assets/images/customer.png';
import Barber from '../../assets/images/barber.png';

const { width, height } = Dimensions.get('window');

const BRAND_BLUE = '#0066FF';
const BG_LIGHT = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT_DARK = '#111827';
const TEXT_GRAY = '#6B7280';

export default function RoleSelectionScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<'user' | 'shop' | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const userScale = useRef(new Animated.Value(1)).current;
  const shopScale = useRef(new Animated.Value(1)).current;

  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelect = (role: 'user' | 'shop') => {
    if (selected === role) {
      setSelected(null);
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(btnTranslateY, { toValue: 60, duration: 280, useNativeDriver: true }),
      ]).start();
      return;
    }

    setSelected(role);

    const activeScale  = role === 'user' ? userScale : shopScale;
    const otherScale   = role === 'user' ? shopScale : userScale;

    otherScale.setValue(1);

    Animated.sequence([
      Animated.timing(activeScale, { toValue: 0.97, duration: 120, useNativeDriver: true }),
      Animated.spring(activeScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(btnTranslateY, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = () => {
    if (selected === 'user') {
      navigation.navigate('Screens/User/Login' as never);
    } else if (selected === 'shop') {
      navigation.navigate('Screens/Shop/Login' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />

      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you'll use BookMyCuts</Text>
      </View>

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.cardsContainer}>
          {/* Customer */}
          <Animated.View style={[styles.cardWrapper, { transform: [{ scale: userScale }] }]}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSelect('user')}
              style={[
                styles.card,
                selected === 'user' && styles.cardSelected,
              ]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={Customer}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={[
                  styles.cardTitle,
                  selected === 'user' && styles.cardTitleSelected,
                ]}>
                  Customer
                </Text>
                <Text style={styles.cardSubtitle}>
                  Discover salons • View styles • Book instantly
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Business */}
          <Animated.View style={[styles.cardWrapper, { transform: [{ scale: shopScale }] }]}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSelect('shop')}
              style={[
                styles.card,
                selected === 'shop' && styles.cardSelected,
              ]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={Barber}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={[
                  styles.cardTitle,
                  selected === 'shop' && styles.cardTitleSelected,
                ]}>
                  Business Owner
                </Text>
                <Text style={styles.cardSubtitle}>
                  Manage bookings • Track earnings • Grow your shop
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabContainer,
          { opacity: btnOpacity, transform: [{ translateY: btnTranslateY }] },
        ]}
        pointerEvents={selected ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.fab} onPress={handleContinue} activeOpacity={0.9}>
          <Text style={styles.fabText}>
            Continue as {selected === 'user' ? 'Customer' : 'Business'}
          </Text>
          <MaterialIcons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 24 : 40,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_GRAY,
    marginTop: 8,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flex: 1,
    gap: 24,
    paddingBottom: 140,
  },
  cardWrapper: {
    flex: 1,
    maxHeight: height * 0.42,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',           // ← crucial for vertical centering
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  cardSelected: {
    borderColor: BRAND_BLUE,
    borderWidth: 2.5,
    shadowOpacity: 0.14,
    shadowColor: BRAND_BLUE,
    elevation: 10,
  },
  imageContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    // removed backgroundColor
  },
  cardImage: {
    width: 140,          // explicit size helps with contain
    height: 140,
  },
  textContainer: {
    flex: 1,
    marginLeft: 28,      // increased a bit for better breathing room
    justifyContent: 'center',  // helps vertical alignment
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardTitleSelected: {
    color: BRAND_BLUE,
  },
  cardSubtitle: {
    fontSize: 15.5,
    color: TEXT_GRAY,
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 32,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  fab: {
    backgroundColor: BRAND_BLUE,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});