import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useNavigation } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { TabBarContext } from '../context/TabBarContext';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width * 0.92;
const TAB_COUNT = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const BAR_HEIGHT = 64;

const tabConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  Home: { icon: 'home', label: 'Home' },
  BookNow: { icon: 'calendar', label: 'Book' },
  Settings: { icon: 'person', label: 'Profile' },
  explore: { icon: 'person-circle', label: 'Explore' }, // Using profile icon as requested
  Profile: { icon: 'settings', label: 'Settings' }
};

/* ─── Tab icon ───────────────────────────────────────────────────── */
const TabIcon = ({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) => {
  const { theme } = useAppTheme();
  const scale = useSharedValue(focused ? 1.2 : 1);
  const translateY = useSharedValue(focused ? -3 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 14, stiffness: 200 });
    translateY.value = withSpring(focused ? -3 : 0, { damping: 14, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={name}
        size={focused ? 24 : 22}
        color={focused ? theme.accent : '#94A3B8'}
      />
    </Animated.View>
  );
};

/* ─── Animated label ─────────────────────────────────────────────── */
const AnimatedLabel = ({ children, focused }: { children: string; focused: boolean }) => {
  const { theme } = useAppTheme();
  const opacity = useSharedValue(focused ? 1 : 0);
  const translateY = useSharedValue(focused ? 0 : 5);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0, { duration: 180 });
    translateY.value = withSpring(focused ? 0 : 5, { damping: 16, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!focused) return null;

  return (
    <Animated.Text style={[styles.tabLabel, { color: theme.accent }, animatedStyle]}>
      {children}
    </Animated.Text>
  );
};

/* ─── Custom Tab Bar ─── */
const CustomTabBar = ({ state, navigation, tabBarOffset }: any) => {
  const routes = useMemo(() => state.routes.slice(0, TAB_COUNT), [state.routes]);
  const currentIndex = state.index < TAB_COUNT ? state.index : 0;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: tabBarOffset.value }],
    };
  });

  return (
    <Animated.View style={[styles.tabBarContainer, animatedStyle]}>
      <BlurView intensity={90} tint="light" style={styles.blurContainer}>
        <View style={styles.tabBarItems}>
          {routes.map((route: any, index: number) => {
            const isFocused = currentIndex === index;
            const config = tabConfig[route.name] ?? { icon: 'help-circle' as any, label: route.name };
            const iconName = isFocused ? config.icon : (`${config.icon}-outline` as any);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <TabIcon name={iconName} focused={isFocused} />
                <AnimatedLabel focused={isFocused}>{config.label}</AnimatedLabel>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </Animated.View>
  );
};

/* ─── Root Layout ─── */
export default function TabLayout() {
  const navigation = useNavigation();
  const tabBarOffset = useSharedValue(0);

  const handleSwipe = (direction: 'left' | 'right') => {
    const navState = navigation.getState() as any;
    if (!navState) return;
    const { index: currentIndex, routes } = navState;

    if (direction === 'left' && currentIndex < routes.length - 1) {
      // @ts-ignore
      navigation.navigate(routes[currentIndex + 1].name);
    } else if (direction === 'right' && currentIndex > 0) {
      // @ts-ignore
      navigation.navigate(routes[currentIndex - 1].name);
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd((event) => {
      'worklet';
      const { translationX, velocityX } = event;
      
      if (Math.abs(translationX) > 80 || Math.abs(velocityX) > 800) {
        if (translationX > 0) {
          runOnJS(handleSwipe)('right');
        } else {
          runOnJS(handleSwipe)('left');
        }
      }
    });

  return (
    <TabBarContext.Provider value={{ tabBarOffset }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={swipeGesture}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Tabs
              tabBar={(props) => <CustomTabBar tabBarOffset={tabBarOffset} {...props} />}
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
              tabBarStyle: {
                position: 'absolute',
                backgroundColor: 'transparent',
                elevation: 0,
                borderTopWidth: 0,
                bottom: 0,
                left: 0,
                right: 0,
                height: 0,
              },
            }}
          >
            <Tabs.Screen name="Home" />
            <Tabs.Screen name="BookNow" />
            <Tabs.Screen name="Settings" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="Profile" />
          </Tabs>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
    </TabBarContext.Provider>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: (width - TAB_BAR_WIDTH) / 2,
    width: TAB_BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9', // Minimalist border instead of shadow
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    borderRadius: BAR_HEIGHT / 2,
  },
  tabBarItems: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});