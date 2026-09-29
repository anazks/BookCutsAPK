import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TabBarContext } from '../context/TabBarContext';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const tabConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  Home: { icon: 'home', label: 'Home' },
  BookNow: { icon: 'calendar', label: 'Book' },
  explore: { icon: 'person-circle', label: 'Profile' },
};

/* ─── Animated Tab Icon ─── */
const TabIcon = ({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}) => {
  const scale = useSharedValue(focused ? 1.15 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 14, stiffness: 220 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={name}
        size={focused ? 22 : 22}
        color={focused ? color : '#94A3B8'}
      />
    </Animated.View>
  );
};

/* ─── Fixed Custom Bottom Tab Bar ─── */
const FixedCustomTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { category, theme } = useAppTheme();

  const categoryGradients: Record<string, [string, string, string]> = {
    men: ['#1E40AF', '#2563EB', '#3B82F6'],
    womens: ['#9D174D', '#E11D48', '#FB7185'],
    kids: ['#B45309', '#D97706', '#F59E0B'],
  };

  const currentGradient = categoryGradients[category] || categoryGradients.men;
  const accentColor = theme?.accent || '#2563EB';

  const routes = useMemo(() => state.routes.slice(0, 3), [state.routes]);
  const currentIndex = state.index < 3 ? state.index : 0;

  const handleTabPress = (route: any, isFocused: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8);

  return (
    <View style={[styles.fixedBarWrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarInner}>
        {routes.map((route: any, index: number) => {
          const isFocused = currentIndex === index;
          const config = tabConfig[route.name] ?? { icon: 'ellipse' as any, label: route.name };
          const isCenterTab = route.name === 'BookNow';

          if (isCenterTab) {
            // ── Elevated Center Hero Action Button ──
            return (
              <View key={route.key} style={styles.centerTabWrapper}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleTabPress(route, isFocused)}
                  style={[
                    styles.centerButtonTouchable,
                    {
                      shadowColor: isFocused ? accentColor : '#0F172A',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={currentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerButtonGradient}
                  >
                    <Ionicons
                      name={isFocused ? 'calendar' : 'calendar-outline'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.centerTabLabel,
                    { color: isFocused ? accentColor : '#64748B', fontWeight: isFocused ? '800' : '600' },
                  ]}
                >
                  {config.label}
                </Text>
              </View>
            );
          }

          // ── Standard Side Tabs (Home & Explore) ──
          const iconName = isFocused ? config.icon : (`${config.icon}-outline` as any);

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handleTabPress(route, isFocused)}
              style={styles.sideTabItem}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.sideTabPill,
                  isFocused && {
                    backgroundColor: `${accentColor}14`, // 8% opacity tint
                  },
                ]}
              >
                <TabIcon name={iconName} focused={isFocused} color={accentColor} />
                <Text
                  style={[
                    styles.sideTabLabel,
                    {
                      color: isFocused ? accentColor : '#64748B',
                      fontWeight: isFocused ? '800' : '600',
                    },
                  ]}
                >
                  {config.label}
                </Text>

                {isFocused && (
                  <View style={[styles.activeDot, { backgroundColor: accentColor }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ─── Root Layout ─── */
export default function TabLayout() {
  const tabBarOffset = useSharedValue(0);

  return (
    <TabBarContext.Provider value={{ tabBarOffset }}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Tabs
          tabBar={(props) => <FixedCustomTabBar {...props} />}
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
          <Tabs.Screen name="explore" />
        </Tabs>
      </View>
    </TabBarContext.Provider>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  fixedBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 999,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 58,
    paddingHorizontal: 16,
  },
  sideTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  sideTabPill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    position: 'relative',
    minWidth: 64,
  },
  sideTabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: -1,
  },
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerButtonTouchable: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    marginTop: -22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});