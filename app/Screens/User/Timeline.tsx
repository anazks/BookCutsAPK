import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

interface FreeGap {
  from: string; // "09:30"
  to: string;   // "11:00"
}

interface TimelineProps {
  freeGaps: FreeGap[];
  totalDuration: number; // in minutes
  openingTime: string;   // "09:00"
  closingTime: string;   // "20:00"
  onSlotChange: (newStartTime: string) => void;
  selectedStartTime?: string | null;
}

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const Timeline: React.FC<TimelineProps> = ({
  freeGaps,
  totalDuration,
  openingTime,
  closingTime,
  onSlotChange,
  selectedStartTime,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const openMin = timeToMinutes(openingTime);
  const closeMin = timeToMinutes(closingTime);
  const totalDayMinutes = closeMin - openMin;

  const scale = 3; // pixels per minute — higher = more space & easier dragging
  const timelineWidth = totalDayMinutes * scale;
  const slotWidth = totalDuration * scale;

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Snap to nearest valid 30-min slot inside a free gap
  const snapToValidSlot = useCallback(
    (currentX: number) => {
      const intendedMinutesAbs = openMin + currentX / scale;

      let bestTime = null;
      let bestX = currentX;
      let minDistance = Infinity;

      for (const gap of freeGaps) {
        let startMin = timeToMinutes(gap.from);
        const endMin = timeToMinutes(gap.to);

        // Align start to 30-min grid
        startMin = Math.max(startMin, Math.ceil(startMin / 30) * 30);

        for (let t = startMin; t <= endMin - totalDuration; t += 30) {
          const candidateX = (t - openMin) * scale;
          const distance = Math.abs(candidateX - currentX);

          if (distance < minDistance) {
            minDistance = distance;
            bestTime = minutesToTime(t);
            bestX = candidateX;
          }
        }
      }

      if (bestTime) {
        onSlotChange(bestTime);
        translateX.value = withTiming(bestX, { duration: 200 });
      } else {
        // No valid slot — snap back
        translateX.value = withTiming(startX.value, { duration: 200 });
      }
    },
    [freeGaps, totalDuration, openMin, scale, onSlotChange, translateX]
  );

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      startX.value = translateX.value;
    },
    onActive: (event) => {
      translateX.value = startX.value + event.translationX;
    },
    onEnd: (event) => {
      const finalX = startX.value + event.translationX;
      runOnJS(snapToValidSlot)(finalX);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Set initial position when selectedStartTime changes
  useEffect(() => {
    if (selectedStartTime && freeGaps.length > 0) {
      const startMin = timeToMinutes(selectedStartTime);
      const x = (startMin - openMin) * scale;

      translateX.value = x;
      startX.value = x;

      // Auto-scroll to center the slot
      setTimeout(() => {
        const scrollToX = Math.max(0, x - screenWidth / 2 + slotWidth / 2);
        scrollRef.current?.scrollTo({ x: scrollToX, animated: true });
      }, 100);
    }
  }, [selectedStartTime, freeGaps]);

  // Auto-select first available slot on mount
  useEffect(() => {
    if (freeGaps.length > 0 && !selectedStartTime) {
      let earliest = Infinity;
      let best = null;

      for (const gap of freeGaps) {
        let t = timeToMinutes(gap.from);
        t = Math.max(t, Math.ceil(t / 30) * 30);
        if (t <= timeToMinutes(gap.to) - totalDuration && t < earliest) {
          earliest = t;
          best = minutesToTime(t);
        }
      }

      if (best) {
        onSlotChange(best);
      }
    }
  }, [freeGaps, selectedStartTime, totalDuration, onSlotChange]);

  // Generate time labels every 30 minutes
  const labels = [];
  let current = Math.ceil(openMin / 30) * 30;
  while (current <= closeMin) {
    const x = (current - openMin) * scale;
    const timeStr = minutesToTime(current);
    const isHour = current % 60 === 0;

    labels.push(
      <Text
        key={timeStr}
        style={{
          position: 'absolute',
          left: x - 30,
          top: 4,
          width: 60,
          textAlign: 'center',
          fontSize: 11,
          fontWeight: isHour ? 'bold' : 'normal',
          color: isHour ? '#1e293b' : '#64748b',
        }}
      >
        {timeStr}
      </Text>
    );
    current += 30;
  }

  // Force opening & closing labels
  labels.unshift(
    <Text key="open" style={styles.endpointLabel}>
      {openingTime}
    </Text>
  );
  labels.push(
    <Text key="close" style={[styles.endpointLabel, { right: 10 }]}>
      {closingTime}
    </Text>
  );

  const selectedEndTime = selectedStartTime
    ? minutesToTime(timeToMinutes(selectedStartTime) + totalDuration)
    : null;

  return (
    <View style={styles.container}>
      {/* Timeline Ruler */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: timelineWidth + 100 }}
        bounces
      >
        <View style={[styles.timeline, { width: timelineWidth }]}>
          {/* Background ruler */}
          <View style={styles.ruler} />

          {/* Time Labels */}
          {labels}

          {/* Hour ticks */}
          {Array.from({ length: Math.ceil(totalDayMinutes / 60) }, (_, i) => {
            const x = i * 60 * scale;
            return (
              <View
                key={`hour-${i}`}
                style={[styles.hourTick, { left: x }]}
              />
            );
          })}

          {/* 30-min minor ticks */}
          {Array.from({ length: Math.ceil(totalDayMinutes / 30) }, (_, i) => {
            const x = i * 30 * scale;
            const isHour = i % 2 === 0;
            if (!isHour) {
              return (
                <View
                  key={`half-${i}`}
                  style={[styles.minorTick, { left: x }]}
                />
              );
            }
            return null;
          })}

          {/* Free Gaps (Green) */}
          {freeGaps.map((gap, i) => {
            const left = (timeToMinutes(gap.from) - openMin) * scale;
            const width = (timeToMinutes(gap.to) - timeToMinutes(gap.from)) * scale;
            return (
              <View
                key={i}
                style={[
                  styles.freeGap,
                  { left, width },
                ]}
              >
                <Text style={styles.gapText}>
                  {gap.from} - {gap.to}
                </Text>
              </View>
            );
          })}

          {/* Draggable Slot (Red) */}
          {selectedStartTime && (
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View
                style={[
                  styles.slot,
                  animatedStyle,
                  { width: slotWidth },
                ]}
              >
                <Text style={styles.slotText}>
                  {selectedStartTime} - {selectedEndTime}
                </Text>
                <Text style={styles.durationText}>{totalDuration} min</Text>
              </Animated.View>
            </PanGestureHandler>
          )}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Green = Available • Red = Your Appointment ({totalDuration} min)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    height: 120,
  },
  timeline: {
    height: 100,
    backgroundColor: '#f8fafc',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ruler: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  endpointLabel: {
    position: 'absolute',
    top: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    left: 10,
  },
  hourTick: {
    position: 'absolute',
    top: 30,
    width: 1,
    height: 50,
    backgroundColor: '#94a3b8',
  },
  minorTick: {
    position: 'absolute',
    top: 30,
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  freeGap: {
    position: 'absolute',
    top: 30,
    height: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.6)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gapText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
  },
  slot: {
    position: 'absolute',
    top: 40,
    height: 50,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    paddingHorizontal: 8,
  },
  slotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
    opacity: 0.9,
  },
  legend: {
    alignItems: 'center',
    marginTop: 12,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default Timeline;