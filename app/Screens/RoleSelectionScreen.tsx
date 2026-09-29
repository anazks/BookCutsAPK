import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Barber from '../../assets/images/barber-removebg-preview.png';
import Customer from '../../assets/images/customer-removebg-preview (1).png';

const { height } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<'user' | 'shop' | null>(null);

  // ── Entrance anims (useNativeDriver: true — opacity + translateY only) ───────
  const logoAnim = useRef(new Animated.Value(0)).current;
  const headAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  // ── Scale anims (useNativeDriver: true — transform only) ─────────────────────
  const userScale = useRef(new Animated.Value(1)).current;
  const shopScale = useRef(new Animated.Value(1)).current;

  // ── Color/bg anims (useNativeDriver: false — backgroundColor/borderColor) ───
  const userGlow = useRef(new Animated.Value(0)).current;
  const shopGlow = useRef(new Animated.Value(0)).current;

  // ── CTA anims (useNativeDriver: true — opacity + transform only) ─────────────
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(0.92)).current;

  // ── Pulse accent (useNativeDriver: false — backgroundColor) ──────────────────
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // All native driver — only opacity + translateY
    Animated.stagger(110, [
      Animated.timing(logoAnim, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headAnim, { toValue: 1, duration: 580, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(card1Anim, { toValue: 1, duration: 680, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      Animated.timing(card2Anim, { toValue: 1, duration: 680, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();

    // JS driver — backgroundColor interpolation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const animateSelect = (role: 'user' | 'shop', entering: boolean) => {
    // scale uses native driver
    const scale = role === 'user' ? userScale : shopScale;
    // glow uses JS driver
    const glow = role === 'user' ? userGlow : shopGlow;

    if (entering) {
      // Scale — native driver
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.96, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.0, friction: 5, tension: 65, useNativeDriver: true }),
      ]).start();
      // Glow — JS driver (separate, never mixed)
      Animated.timing(glow, { toValue: 1, duration: 280, useNativeDriver: false }).start();
    } else {
      // Scale — native driver
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
      // Glow — JS driver
      Animated.timing(glow, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    }
  };

  const handleSelect = (role: 'user' | 'shop') => {
    if (selected === role) {
      setSelected(null);
      animateSelect(role, false);
      // CTA hide — native driver
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(btnSlide, { toValue: 40, duration: 200, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 0.92, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }
    if (selected) animateSelect(selected, false);
    setSelected(role);
    animateSelect(role, true);
    // CTA show — native driver
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.spring(btnSlide, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = () => {
    if (selected === 'user') navigation.navigate('Screens/User/Login' as never);
    if (selected === 'shop') navigation.navigate('Screens/Shop/Login' as never);
  };

  // ── JS-driver interpolations (colors only) ───────────────────────────────────
  const pulseColor = pulse.interpolate({ inputRange: [0, 1], outputRange: ['#0057FF', '#4480FF'] });
  const userBorderCol = userGlow.interpolate({ inputRange: [0, 1], outputRange: ['#E4E9F2', '#0057FF'] });
  const shopBorderCol = shopGlow.interpolate({ inputRange: [0, 1], outputRange: ['#E4E9F2', '#0057FF'] });
  const userBgCol = userGlow.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#EEF3FF'] });
  const shopBgCol = shopGlow.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#EEF3FF'] });

  // ── Native-driver interpolations (opacity + translateY only) ─────────────────
  const card1Style = {
    opacity: card1Anim,
    transform: [{ translateY: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
  };
  const card2Style = {
    opacity: card2Anim,
    transform: [{ translateY: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }],
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />

      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Logo bar — native anim wrapper */}
      <Animated.View style={[styles.logoBar, {
        opacity: logoAnim,
        transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }]}>
        <View style={styles.logoIconWrap}>
          <MaterialIcons name="content-cut" size={16} color="#0057FF" />
        </View>
        <Text style={styles.logoLabel}>BookMyCuts</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>
      </Animated.View>

      {/* Header — native anim wrapper */}
      <Animated.View style={[styles.header, {
        opacity: headAnim,
        transform: [{ translateY: headAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }]}>
        <Text style={styles.eyebrow}>WELCOME</Text>
        <Text style={styles.title}>Choose your{'\n'}experience</Text>
        {/* Pulse accent — JS anim, separate view, no native props */}
        <Animated.View style={[styles.accent, { backgroundColor: pulseColor }]} />
        <Text style={styles.subtitle}>Your role tailors everything for you</Text>
      </Animated.View>

      {/* Cards */}
      <View style={styles.cards}>

        {/* ── Customer card ── */}
        {/* Outer: native driver (opacity + translateY from entrance) */}
        <Animated.View style={[styles.cardWrap, card1Style]}>
          {/* 
            KEY FIX: scale (native) and color (JS) are on SEPARATE Animated.Views.
            They must never be on the same Animated.View.
          */}
          {/* Scale wrapper — native driver only */}
          <Animated.View style={{ flex: 1, transform: [{ scale: userScale }] }}>
            {/* Color wrapper — JS driver only (backgroundColor + borderColor) */}
            <Animated.View style={[styles.cardShell, {
              borderColor: userBorderCol,
              backgroundColor: userBgCol,
            }]}>
              <TouchableOpacity style={styles.cardBody} onPress={() => handleSelect('user')} activeOpacity={0.9}>
                <View style={[styles.roleBadge, selected === 'user' && styles.roleBadgeActive]}>
                  <Text style={[styles.roleBadgeText, selected === 'user' && styles.roleBadgeTextActive]}>
                    CUSTOMER
                  </Text>
                </View>
                <View style={styles.imgWrap}>
                  <Image source={Customer} style={styles.img} resizeMode="contain" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.cardHeading}>Find &{'\n'}Book Cuts</Text>
                  <Text style={styles.cardDesc}>Discover local barbers, read reviews, and book instantly.</Text>
                  <View style={styles.chips}>
                    {['Discover', 'Review', 'Book'].map(chip => (
                      <View key={chip} style={[styles.chip, selected === 'user' && styles.chipActive]}>
                        <Text style={[styles.chipText, selected === 'user' && styles.chipTextActive]}>{chip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {selected === 'user' && (
                  <View style={styles.checkBadge}>
                    <MaterialIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* OR separator */}
        <View style={styles.separator}>
          <View style={styles.sepLine} />
          <View style={styles.sepPill}>
            <Text style={styles.sepText}>OR</Text>
          </View>
          <View style={styles.sepLine} />
        </View>

        {/* ── Business card ── */}
        <Animated.View style={[styles.cardWrap, card2Style]}>
          {/* Scale wrapper — native driver only */}
          <Animated.View style={{ flex: 1, transform: [{ scale: shopScale }] }}>
            {/* Color wrapper — JS driver only */}
            <Animated.View style={[styles.cardShell, {
              borderColor: shopBorderCol,
              backgroundColor: shopBgCol,
            }]}>
              <TouchableOpacity style={styles.cardBody} onPress={() => handleSelect('shop')} activeOpacity={0.9}>
                <View style={[styles.roleBadge, selected === 'shop' && styles.roleBadgeActive]}>
                  <Text style={[styles.roleBadgeText, selected === 'shop' && styles.roleBadgeTextActive]}>
                    BUSINESS
                  </Text>
                </View>
                <View style={styles.imgWrap}>
                  <Image source={Barber} style={styles.img} resizeMode="contain" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.cardHeading}>Run Your{'\n'}Shop</Text>
                  <Text style={styles.cardDesc}>Manage bookings, track earnings, and grow your client base.</Text>
                  <View style={styles.chips}>
                    {['Manage', 'Earn', 'Grow'].map(chip => (
                      <View key={chip} style={[styles.chip, selected === 'shop' && styles.chipActive]}>
                        <Text style={[styles.chipText, selected === 'shop' && styles.chipTextActive]}>{chip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {selected === 'shop' && (
                  <View style={styles.checkBadge}>
                    <MaterialIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* CTA Button — native driver (opacity + transform only) */}
      <Animated.View
        style={[styles.ctaWrap, {
          opacity: btnOpacity,
          transform: [{ translateY: btnSlide }, { scale: btnScale }],
        }]}
        pointerEvents={selected ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.87}>
          <Text style={styles.ctaLabel}>
            Continue as {selected === 'user' ? 'Customer' : 'Business Owner'}
          </Text>
          <View style={styles.ctaIcon}>
            <MaterialIcons name="arrow-forward" size={18} color="#0057FF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },

  blob1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#D6E4FF',
    opacity: 0.45,
  },
  blob2: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E0ECFF',
    opacity: 0.5,
  },

  logoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 18,
    paddingHorizontal: 22,
    gap: 9,
  },
  logoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF3FF',
    borderWidth: 1,
    borderColor: '#B8CCFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1321',
    letterSpacing: 0.3,
    flex: 1,
  },
  stepBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7A99',
    letterSpacing: 0.2,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0057FF',
    letterSpacing: 3.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0D1321',
    lineHeight: 44,
    letterSpacing: -1,
  },
  accent: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 14,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7A99',
    lineHeight: 20,
  },

  cards: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 110,
    justifyContent: 'center',
  },
  cardWrap: {
    flex: 1,
    maxHeight: height * 0.265,
  },
  cardShell: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#2255CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  roleBadge: {
    position: 'absolute',
    top: 13,
    right: 14,
    backgroundColor: '#F0F3FA',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  roleBadgeActive: {
    backgroundColor: '#EEF3FF',
    borderColor: '#B8CCFF',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7A99',
    letterSpacing: 1.5,
  },
  roleBadgeTextActive: {
    color: '#0057FF',
  },

  imgWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  img: {
    width: 100,
    height: 100,
  },

  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D1321',
    lineHeight: 27,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#6B7A99',
    lineHeight: 18,
    marginBottom: 12,
  },

  chips: {
    flexDirection: 'row',
    gap: 5,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#F0F3FA',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  chipActive: {
    backgroundColor: '#EEF3FF',
    borderColor: '#B8CCFF',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7A99',
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: '#0057FF',
  },

  checkBadge: {
    position: 'absolute',
    bottom: 13,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0057FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 10,
  },
  sepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4E9F2',
  },
  sepPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sepText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7A99',
    letterSpacing: 1.5,
  },

  ctaWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 38 : 26,
    left: 18,
    right: 18,
  },
  cta: {
    backgroundColor: '#0057FF',
    borderRadius: 17,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#0057FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});