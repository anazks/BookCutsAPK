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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BRAND_BLUE = '#1877F2';
const LIGHT_BLUE = '#EFF6FF';
const TEXT_DARK = '#1e293b';
const TEXT_GRAY = '#64748b';

export default function RoleSelectionScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<'user' | 'shop' | null>(null);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Card animations
  const userCardScale = useRef(new Animated.Value(1)).current;
  const shopCardScale = useRef(new Animated.Value(1)).current;
  
  // Button animation
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelect = (role: 'user' | 'shop') => {
    if (selected === role) {
      setSelected(null);
      // Hide button
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    
    setSelected(role);

    // Scale animation for selected card
    const scale = role === 'user' ? userCardScale : shopCardScale;
    const otherScale = role === 'user' ? shopCardScale : userCardScale;

    otherScale.setValue(1);

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.02,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Show continue button
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(buttonSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Simple Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={[styles.patternCircle, styles.patternCircle1]} />
        <View style={[styles.patternCircle, styles.patternCircle2]} />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <MaterialIcons name="content-cut" size={32} color={BRAND_BLUE} />
            </View>
          </View>
          <Text style={styles.greeting}>Welcome to BookMyCuts</Text>
          <Text style={styles.subtitle}>
            Select who you are to continue
          </Text>
        </View>

        {/* Cards - Full Width Stacked */}
        <View style={styles.cardsContainer}>
          {/* Customer Card */}
          <Animated.View style={[
            styles.cardWrapper,
            {
              transform: [{ scale: userCardScale }],
            }
          ]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelect('user')}
              style={styles.cardTouchable}
            >
              <View style={[
                styles.card,
                selected === 'user' && styles.cardSelected
              ]}>
                <View style={styles.cardContent}>
                  <View style={[
                    styles.iconContainer,
                    selected === 'user' && styles.iconContainerSelected
                  ]}>
                    <MaterialIcons 
                      name="person" 
                      size={28} 
                      color={selected === 'user' ? '#FFFFFF' : BRAND_BLUE} 
                    />
                  </View>
                  
                  <View style={styles.cardTextContainer}>
                    <Text style={[
                      styles.cardTitle,
                      selected === 'user' && styles.cardTitleSelected
                    ]}>
                      Customer
                    </Text>
                    
                    <Text style={[
                      styles.cardDescription,
                      selected === 'user' && styles.cardDescriptionSelected
                    ]}>
                      Find salons, book appointments, get haircuts
                    </Text>
                  </View>

                  {selected === 'user' && (
                    <View style={styles.selectedBadge}>
                      <MaterialIcons name="check-circle" size={24} color={BRAND_BLUE} />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Business Card */}
          <Animated.View style={[
            styles.cardWrapper,
            {
              transform: [{ scale: shopCardScale }],
            }
          ]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelect('shop')}
              style={styles.cardTouchable}
            >
              <View style={[
                styles.card,
                selected === 'shop' && styles.cardSelected
              ]}>
                <View style={styles.cardContent}>
                  <View style={[
                    styles.iconContainer,
                    selected === 'shop' && styles.iconContainerSelected
                  ]}>
                    <MaterialIcons 
                      name="storefront" 
                      size={28} 
                      color={selected === 'shop' ? '#FFFFFF' : BRAND_BLUE} 
                    />
                  </View>
                  
                  <View style={styles.cardTextContainer}>
                    <Text style={[
                      styles.cardTitle,
                      selected === 'shop' && styles.cardTitleSelected
                    ]}>
                      Business
                    </Text>
                    
                    <Text style={[
                      styles.cardDescription,
                      selected === 'shop' && styles.cardDescriptionSelected
                    ]}>
                      Own a salon? Manage bookings, staff & grow
                    </Text>
                  </View>

                  {selected === 'shop' && (
                    <View style={styles.selectedBadge}>
                      <MaterialIcons name="check-circle" size={24} color={BRAND_BLUE} />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Continue Button */}
        <Animated.View style={[
          styles.buttonWrapper,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide }],
          }
        ]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>
              {selected === 'user' && 'Continue as Customer'}
              {selected === 'shop' && 'Continue as Business Owner'}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
      
      </Animated.View>
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
    width: '100%',
    height: '100%',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: BRAND_BLUE,
    opacity: 0.03,
  },
  patternCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  patternCircle2: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoInner: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: LIGHT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND_BLUE,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_GRAY,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  cardWrapper: {
    width: '100%',
  },
  cardTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
  },
  cardSelected: {
    borderColor: BRAND_BLUE,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: LIGHT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: BRAND_BLUE,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: BRAND_BLUE,
  },
  cardDescription: {
    fontSize: 13,
    color: TEXT_GRAY,
    lineHeight: 18,
  },
  cardDescriptionSelected: {
    color: '#334155',
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: BRAND_BLUE,
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingBottom: 10,
  },
  footerNote: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  helpLink: {
    fontSize: 14,
    color: BRAND_BLUE,
    fontWeight: '600',
  },
});