// components/ServicesSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => `₹${price}`;
  const totalSelected = selectedServices.length;

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cut-outline" size={16} color="#2563EB" />
          <Text style={styles.headerTitle}> Select Services</Text>
          {totalSelected > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalSelected}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.searchToggle} 
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons 
            name={showSearch ? "close" : "search"} 
            size={16} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Compact */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={14} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Services List - Compact Horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredServices.map((service) => {
          const isSelected = selectedServices.some((s) => s.id === service.id);

          return (
            <TouchableOpacity
              key={service.id ?? service.name}
              style={[styles.serviceCard, isSelected && styles.selectedCard]}
              onPress={() => onToggleService(service)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.serviceName} numberOfLines={1}>
                  {service.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, isSelected && styles.selectedPrice]}>
                    {formatPrice(service.price)}
                  </Text>
                  <View style={[styles.duration, isSelected && styles.selectedDuration]}>
                    <Ionicons 
                      name="time-outline" 
                      size={8} 
                      color={isSelected ? "#FFFFFF" : "#6B7280"} 
                    />
                    <Text style={[styles.durationText, isSelected && styles.selectedDurationText]}>
                      {service.duration}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={[styles.addButton, isSelected && styles.addButtonSelected]}>
                <Ionicons 
                  name={isSelected ? "checkmark" : "add"} 
                  size={12} 
                  color={isSelected ? "#FFFFFF" : "#2563EB"} 
                />
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredServices.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No services found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginBottom: 12,
  },
  
  // Compact Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  searchToggle: {
    padding: 4,
  },

  // Compact Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
    height: '100%',
    color: '#1F2937',
  },

  // Scroll Content
  scrollContent: {
    paddingRight: 8,
    gap: 8,
  },

  // Compact Service Card
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 8,
    minWidth: 140,
    gap: 8,
  },
  selectedCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  cardContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedPrice: {
    color: '#2563EB',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedDuration: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durationText: {
    fontSize: 8,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedDurationText: {
    color: '#FFFFFF',
  },

  // Compact Add Button
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  // Empty State
  emptyCard: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});