import { fetchUniqueServices } from '@/app/api/Service/User';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ServiceItem = {
  id: string;
  name: string;
  icon: string;
};

const SERVICE_ICONS: Record<string, string> = {
  all: 'apps',
  haircut: 'cut-outline',
  shave: 'cut',
  beard: 'man-outline',
  facial: 'sparkles-outline',
  color: 'color-palette-outline',
  waxing: 'flame-outline',
  massage: 'hand-left-outline',
  nails: 'finger-print-outline',
  threading: 'git-merge-outline',
};

const getIcon = (name: string): string => {
  const key = name.toLowerCase();
  for (const k of Object.keys(SERVICE_ICONS)) {
    if (key.includes(k)) return SERVICE_ICONS[k];
  }
  return 'cut-outline';
};

function ServiceChip({
  service,
  isSelected,
  onPress,
  index,
}: {
  service: ServiceItem;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {isSelected ? (
          /* Selected: gold gradient pill with glow border */
          <View style={styles.selectedWrapper}>
            <LinearGradient
              colors={['rgba(212,175,55,0.25)', 'rgba(212,175,55,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chipSelected}
            >
              <View style={styles.chipInner}>
                <Ionicons
                  name={service.icon as any}
                  size={15}
                  color="#D4AF37"
                />
                <Text style={styles.textSelected}>{service.name}</Text>
              </View>
            </LinearGradient>
          </View>
        ) : (
          /* Unselected: ghost pill */
          <View style={styles.chipUnselected}>
            <Ionicons
              name={service.icon as any}
              size={15}
              color="rgba(255,255,255,0.35)"
            />
            <Text style={styles.textUnselected}>{service.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ServiceFilter({ onServiceChange }: { onServiceChange?: (name: string | null) => void }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedId, setSelectedId] = useState('all');

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    try {
      const response = await fetchUniqueServices();

      if (response?.success && response?.service) {
        const formatted: ServiceItem[] = [
          { id: 'all', name: 'All', icon: 'apps' },
          ...response.service.map((name: string, index: number) => ({
            id: index.toString(),
            name,
            icon: getIcon(name),
          })),
        ];
        setServices(formatted);
      }
    } catch (error) {
      console.log('Service fetch error:', error);
    }
  };

  const handlePress = (service: ServiceItem) => {
    setSelectedId(service.id);
    onServiceChange?.(service.name === 'All' ? null : service.name);
  };

  return (
    <View style={styles.container}>
      {/* Gold accent line at top */}
      <View style={styles.accentLine} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {services.map((service, index) => (
          <ServiceChip
            key={service.id}
            service={service}
            isSelected={selectedId === service.id}
            onPress={() => handlePress(service)}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },

  accentLine: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(212,175,55,0.15)',
  },

  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },

  /* ── Selected chip ──────────────────────────── */
  selectedWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    // subtle glow via shadow
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  chipSelected: {
    borderRadius: 23,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },

  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  textSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.4,
  },

  /* ── Unselected chip ────────────────────────── */
  chipUnselected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  textUnselected: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
});