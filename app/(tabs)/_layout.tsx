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
    height: Platform.OS === 'ios' ? 85 : 75,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 15,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: '#eff6ff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  activeLabel: {
    color: '#2563eb',
  },
  inactiveLabel: {
    color: '#64748b',
  },
});

// Tab configuration - Updated to match your actual file structure
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
  const fadeAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simple fade animation
    Animated.timing(fadeAnim, {
      toValue: focused ? 1 : 0.6,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Subtle scale animation on focus
    Animated.timing(scaleAnim, {
      toValue: focused ? 1.05 : 1,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [focused, fadeAnim, scaleAnim]);

  const getIconName = () => {
    if (!focused && IconComponent === Ionicons) {
      return `${iconName}-outline`;
    }
    return iconName;
  };

  return (
    <Animated.View 
      style={[
        styles.tabItem,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <View 
        style={[
          styles.iconContainer,
          focused && styles.activeIconContainer,
        ]}
      >
        <IconComponent
          name={getIconName()}
          size={focused ? 22 : 20}
          color={focused ? '#2563eb' : '#64748b'}
        />
      </View>
      
      <Text
        style={[
          styles.label,
          focused ? styles.activeLabel : styles.inactiveLabel,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
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
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
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
      <Tabs.Screen 
        name="Home" 
        options={{ 
          title: 'Home',
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="BookNow" 
        options={{ 
          title: 'Book Now',
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Explore',
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="Settings" 
        options={{ 
          title: 'Profile',
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="Profile" 
        options={{ 
          title: 'Settings',
          headerShown: false,
        }} 
      />
    </Tabs>
  );
}