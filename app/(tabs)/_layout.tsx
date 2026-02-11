import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: Platform.OS === 'ios' ? 88 : 72,
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.2)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 32,
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  activeLabel: {
    color: '#D4AF37',
  },
  inactiveLabel: {
    color: 'rgba(255,255,255,0.35)',
  },
  /* Gold dot indicator under active icon */
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    marginTop: 4,
  },
});

const tabConfig = {
  Home: {
    iconName: 'home',
    label: 'Home',
    IconComponent: Ionicons,
  },
  BookNow: {
    iconName: 'calendar',
    label: 'Book Now',
    IconComponent: Ionicons,
  },
  explore: {
    iconName: 'compass',
    label: 'Explore',
    IconComponent: Ionicons,
  },
  Settings: {
    iconName: 'person',
    label: 'Profile',
    IconComponent: Ionicons,
  },
  Profile: {
    iconName: 'settings',
    label: 'Settings',
    IconComponent: Ionicons,
  },
};

interface AnimatedTabIconProps {
  focused: boolean;
  iconName: string;
  label: string;
  IconComponent: any;
}

const AnimatedTabIcon = ({ focused, iconName, label, IconComponent }: AnimatedTabIconProps) => {
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const dotScaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    // Icon spring scale on focus
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();

    // Gold glow fade
    Animated.timing(glowAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Active dot pop
    Animated.spring(dotScaleAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 25,
      bounciness: 10,
    }).start();
  }, [focused]);

  const getIconName = () => {
    if (!focused && IconComponent === Ionicons) {
      return `${iconName}-outline`;
    }
    return iconName;
  };

  return (
    <View style={styles.tabItem}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
          <Animated.View style={{ opacity: glowAnim, position: 'absolute', width: '100%', height: '100%', borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.06)' }} />
          <IconComponent
            name={getIconName()}
            size={focused ? 21 : 20}
            color={focused ? '#D4AF37' : 'rgba(255,255,255,0.35)'}
          />
        </View>
      </Animated.View>

      <Text style={[styles.label, focused ? styles.activeLabel : styles.inactiveLabel]}>
        {label}
      </Text>

      {/* Gold dot */}
      <Animated.View style={[styles.activeDot, { transform: [{ scale: dotScaleAnim }] }]} />
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const config = tabConfig[route.name as keyof typeof tabConfig];

        if (!config) {
          return {
            headerShown: false,
            tabBarStyle: { display: 'none' },
          };
        }

        return {
          headerShown: false,
          headerShadowVisible: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#D4AF37',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName={config.iconName}
              label={config.label}
              IconComponent={config.IconComponent}
            />
          ),
        };
      }}
    >
      <Tabs.Screen name="Home"    options={{ title: 'Home',     headerShown: false }} />
      <Tabs.Screen name="BookNow" options={{ title: 'Book Now', headerShown: false }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore',  headerShown: false }} />
      <Tabs.Screen name="Settings" options={{ title: 'Profile', headerShown: false }} />
      <Tabs.Screen name="Profile"  options={{ title: 'Settings',headerShown: false }} />
    </Tabs>
  );
}