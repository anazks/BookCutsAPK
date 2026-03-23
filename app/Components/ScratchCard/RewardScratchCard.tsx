import React, { useState, useRef, useEffect } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet, Dimensions, Modal, TouchableOpacity } from 'react-native';
import Svg, { Defs, Rect, Mask, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.1;

interface RewardScratchCardProps {
  visible: boolean;
  onClose: () => void;
  rewardText: string;
}

export default function RewardScratchCard({ visible, onClose, rewardText }: RewardScratchCardProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [isScratched, setIsScratched] = useState(false);
  const pathRef = useRef('');
  const pointsCount = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Reset state when visible becomes true
  useEffect(() => {
    if (visible) {
      setPaths([]);
      setIsScratched(false);
      pathRef.current = '';
      pointsCount.current = 0;
      fadeAnim.setValue(1);
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isScratched,
    onMoveShouldSetPanResponder: () => !isScratched,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      pathRef.current += `M${locationX},${locationY} `;
      setPaths([pathRef.current]);
    },
    onPanResponderMove: (evt) => {
      if (isScratched) return;
      const { locationX, locationY } = evt.nativeEvent;
      pathRef.current += `L${locationX},${locationY} `;
      setPaths([pathRef.current]);
      pointsCount.current += 1;
      
      // Auto-reveal after enough scratching (approx 60-80 touch points depending on speed)
      if (pointsCount.current > 70 && !isScratched) {
        setIsScratched(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    },
    onPanResponderRelease: () => {}
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>You won a Scratch Card!</Text>
            <Text style={styles.subtitle}>Swipe over the gray area to reveal your reward from BookMyCuts</Text>
          </View>

          {/* Underlay (The Reward) */}
          <View style={styles.rewardContainer}>
            <Ionicons name="gift" size={64} color="#1877F2" style={{ marginBottom: 16 }} />
            <Text style={styles.rewardText}>{rewardText}</Text>
          </View>

          {/* The scratchable SVG layer */}
          <Animated.View style={[styles.svgContainer, { opacity: fadeAnim }]} {...panResponder.panHandlers}>
            <Svg width="100%" height="100%">
              <Defs>
                <Mask id="mask">
                  <Rect width="100%" height="100%" fill="white" />
                  <Path
                    d={paths[0] || ''}
                    fill="none"
                    stroke="black"
                    strokeWidth={45}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Mask>
              </Defs>
              <Rect width="100%" height="100%" fill="#CBD5E1" mask="url(#mask)" />
              {/* Pattern to look like a scratch card */}
              <Rect width="100%" height="100%" fill="#E2E8F0" fillOpacity="0.5" mask="url(#mask)" />
            </Svg>
            {/* Center Text telling them to scratch */}
            <View style={styles.scratchPrompt} pointerEvents="none">
              <Text style={styles.scratchPromptText}>SCRATCH HERE</Text>
            </View>
          </Animated.View>

          {/* Close Button (only visible after scratching) */}
          {isScratched && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  rewardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  rewardText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1877F2',
    textAlign: 'center',
  },
  svgContainer: {
    position: 'absolute',
    top: 90, 
    left: 20,
    right: 20,
    bottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#CBD5E1',
  },
  scratchPrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scratchPromptText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 2,
    opacity: 0.8,
  },
  closeBtn: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#1877F2',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
