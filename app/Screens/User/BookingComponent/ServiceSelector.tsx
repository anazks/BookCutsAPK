// components/ServicesSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Service = {
  id: string | null;
  name: string;
  price: number;
  duration: number;
};

type ServicesSelectorProps = {
  services: Service[];
  selectedServices: Service[];
  onToggleService: (service: Service) => void;
};

export const ServicesSelector = ({
  services,
  selectedServices,
  onToggleService,
}: ServicesSelectorProps) => {
  return (
    <View style={styles.section}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
     </Text>
      {/* <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Services</Text>
        <Text style={styles.sectionSubtitle}>Choose one or more services</Text>
      </View> */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.servicesScrollContent}
      >
        {services.map((service) => {
          const isSelected = selectedServices.some((s) => s.id === service.id);

          return (
            <TouchableOpacity
              key={service.id ?? `default-${service.name}`}
              style={[
                styles.serviceCard,
                isSelected && styles.selectedServiceCard,
              ]}
              onPress={() => onToggleService(service)}
              activeOpacity={0.78}
            >
              <View style={styles.serviceContent}>
                <Text style={styles.serviceName} numberOfLines={2}>
                  {service.name}
                </Text>

                <View style={styles.priceDurationRow}>
                  <Text style={styles.servicePrice}>₹{service.price}</Text>

                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={10} color="#FFFFFF" />
                    <Text style={styles.durationText}>{service.duration} min</Text>
                  </View>
                </View>
              </View>

              {isSelected && (
                <View style={styles.checkmarkOverlay}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#10B981"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    // marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  servicesScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  serviceCard: {
    width: 138,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  selectedServiceCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 8,
  },
  priceDurationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
});