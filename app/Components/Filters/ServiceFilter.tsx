import { fetchUniqueServices } from '@/app/api/Service/User';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type ServiceItem = {
  id: string;
  name: string;
  icon: string;
};

const iconMap: Record<string, string> = {
  Haircut: 'cut',
  Spa: 'leaf',
  CarWash: 'car',
  Repair: 'construct',
};

export default function ServiceFilter({ onServiceChange }) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState('all');

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    try {
      const response = await fetchUniqueServices();

      if (response?.success && response?.service) {
        const formattedServices: ServiceItem[] = [
          { id: 'all', name: 'All', icon: 'apps' },
          ...response.service.map((name: string, index: number) => ({
            id: index.toString(),
            name,
            icon: iconMap[name] || 'grid-outline',
          })),
        ];

        setServices(formattedServices);
      }
    } catch (error) {
      console.log('Service fetch error:', error);
    }
  };

  const handleServicePress = (service: ServiceItem) => {
    setSelectedService(service.id);
    onServiceChange?.(service.name);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {services.map((service) => (
          <FilterItem
            key={service.id}
            service={service}
            selected={selectedService === service.id}
            onPress={() => handleServicePress(service)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/* ─── Animated Filter Item ───────────────────────── */
const FilterItem = ({ service, selected, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.filterBox,
          selected && styles.filterBoxSelected,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Ionicons
          name={service.icon as any}
          size={18}
          color={selected ? '#4F46E5' : '#6B7280'}
        />
        <Text
          style={[
            styles.filterText,
            selected && styles.filterTextSelected,
          ]}
        >
          {service.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─── Styles ─────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterBoxSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderColor: '#4F46E5',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});