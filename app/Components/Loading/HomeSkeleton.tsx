import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HomeSkeleton = () => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const SkeletonBlock = ({ w, h, borderRadius, style }: any) => (
    <Animated.View style={[animatedStyle, { width: w, height: h, borderRadius, backgroundColor: '#E2E8F0', ...style }]} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header Skeleton (Matches Zomato-style height 260) */}
      <View style={{
        height: 260,
        backgroundColor: '#1877F2',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 48,
        paddingHorizontal: 20,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['rgba(24, 119, 242, 0.95)', 'rgba(24, 119, 242, 0.85)']}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        
        {/* Top Bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Animated.View style={[animatedStyle, { width: 120, height: 36, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Animated.View style={[animatedStyle, { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
            <Animated.View style={[animatedStyle, { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
          </View>
        </View>

        {/* Welcome Text block */}
        <Animated.View style={[animatedStyle, { width: 160, height: 28, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginBottom: 8 }]} />
        <Animated.View style={[animatedStyle, { width: 100, height: 16, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginBottom: 24 }]} />

        {/* Search Bar Skeleton */}
        <Animated.View style={[animatedStyle, { width: '100%', height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
      </View>

      <View style={{ flex: 1, padding: 16, marginTop: 10 }}>
        {/* Services Skeleton */}
        <SkeletonBlock w={100} h={20} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} w={80} h={36} borderRadius={20} />
          ))}
        </View>

        {/* Top Brands Skeleton */}
        <SkeletonBlock w={130} h={20} borderRadius={6} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32, overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <SkeletonBlock w={72} h={72} borderRadius={36} style={{ marginBottom: 8 }} />
              <SkeletonBlock w={60} h={12} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Trending Styles Skeleton */}
        <SkeletonBlock w={140} h={20} borderRadius={6} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 16, overflow: 'hidden' }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} w={140} h={180} borderRadius={16} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default HomeSkeleton;
