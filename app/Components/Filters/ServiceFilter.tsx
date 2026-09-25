import { fetchUniqueServices } from '@/app/api/Service/User';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ServiceItem = {
  id: string;
  name: string;
};

export default function ServiceFilter({
  onServiceChange,
}: {
  onServiceChange?: (name: string) => void;
}) {
  const [services, setServices] = useState<ServiceItem[]>([
    { id: 'all', name: 'All' },
    { id: '1', name: 'Haircut' },
    { id: '2', name: 'Beard Trim' },
    { id: '3', name: 'Spa' },
    { id: '4', name: 'Facial' },
    { id: '5', name: 'Massage' },
    { id: '6', name: 'Hair Color' },
  ]);
  const [selectedId, setSelectedId] = useState('all');

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    try {
      const response = await fetchUniqueServices();

      if (response?.success && response?.service && response.service.length > 0) {
        const formatted: ServiceItem[] = [
          { id: 'all', name: 'All' },
          ...response.service.map((name: string, index: number) => ({
            id: (index + 1).toString(),
            name,
          })),
        ];
        setServices(formatted);
      }
    } catch (error) {
      console.log('Service fetch error:', error);
    }
  };

  const handlePress = (service: ServiceItem) => {
    if (selectedId === service.id && service.id !== 'all') {
      setSelectedId('all');
      onServiceChange?.('All');
    } else {
      setSelectedId(service.id);
      onServiceChange?.(service.name);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {services.map((service) => {
          const isSelected = selectedId === service.id;
          return (
            <TouchableOpacity
              key={service.id}
              onPress={() => handlePress(service)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                isSelected ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {service.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chipText: {
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
  chipTextInactive: {
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});