import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const services = [
  { id: '1', name: 'All', icon: 'apps' },
  { id: '2', name: 'Haircut', icon: 'cut' },
  { id: '3', name: 'Beard Trim', icon: 'leaf' },
  { id: '4', name: 'Face Wash', icon: 'water' },
  { id: '5', name: 'Hair Color', icon: 'color-palette' },
  { id: '6', name: 'Styling', icon: 'brush' },
  { id: '7', name: 'Massage', icon: 'hand-left' },
  { id: '8', name: 'Facial', icon: 'sparkles' },
  { id: '9', name: 'Shave', icon: 'cut-outline' },
  { id: '10', name: 'Waxing', icon: 'flame' },
];

export default function ServiceFilter() {
  const [selectedService, setSelectedService] = useState('1');

  const handleServicePress = (serviceId: string) => {
    setSelectedService(serviceId);
    // Add your filter logic here
    console.log('Selected service:', serviceId);
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