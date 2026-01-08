import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchUniqueServices } from '@/app/api/Service/User';

type ServiceItem = {
  id: string;
  name: string;
  icon: string;
};

export default function ServiceFilter() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState('all');

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    try {
      const response = await fetchUniqueServices();
      console.log(response, 'UNIQUE SERVICE');

      if (response?.success && response?.service) {
        const formattedServices: ServiceItem[] = [
          {
            id: 'all',
            name: 'All',
            icon: 'apps',
          },
          ...response.service.map((name: string, index: number) => ({
            id: index.toString(),
            name,
            icon: 'cut-outline', // default icon
          })),
        ];

        setServices(formattedServices);
      }
    } catch (error) {
      console.log('Service fetch error:', error);
    }
  };

  const handleServicePress = (serviceId: string) => {
    setSelectedService(serviceId);
    console.log('Selected service:', serviceId);
    // 👉 filter logic can be added here
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {services.map((service) => {
          const isSelected = selectedService === service.id;

          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.filterBox,
                isSelected && styles.filterBoxSelected,
              ]}
              onPress={() => handleServicePress(service.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={service.icon as any}
                size={20}
                color={isSelected ? '#FFFFFF' : '#6B7280'}
              />
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextSelected,
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
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterBoxSelected: {
    backgroundColor: '#FC8019',
    borderColor: '#FC8019',
    borderWidth: 1,
    shadowColor: '#FC8019',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});