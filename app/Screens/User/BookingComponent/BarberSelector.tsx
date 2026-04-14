// components/BarberSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Barber = {
  id: string | null;
  name: string;
  nativePlace?: string;
};

type BarberSelectorProps = {
  barbers: Barber[];
  selectedBarber: Barber | null;
  onSelect: (barber: Barber) => void;
};

export const BarberSelector = memo(
  ({ barbers, selectedBarber, onSelect }: BarberSelectorProps) => {
    const handleSelect = useCallback(
      (barber: Barber) => {
        onSelect(barber);
      },
      [onSelect]
    );

    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Barber</Text>
          <Text style={styles.subtitle}>Select preferred barber (or any available)</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {barbers.map((barber) => (
            <BarberCard
              key={barber.id ?? 'any'}
              barber={barber}
              isSelected={selectedBarber?.id === barber.id}
              onSelect={handleSelect}
            />
          ))}
        </ScrollView>
      </View>
    );
  }
);

const BarberCard = memo(
  ({
    barber,
    isSelected,
    onSelect,
  }: {
    barber: Barber;
    isSelected: boolean;
    onSelect: (barber: Barber) => void;
  }) => {
    const isAny = barber.id === null;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
        onPress={() => onSelect(barber)}
        activeOpacity={0.85}
      >


        <Text style={styles.name} numberOfLines={1}>
          {barber.name}
        </Text>

        {!isAny && barber.nativePlace && (
          <Text style={styles.location} numberOfLines={1}>
            {barber.nativePlace}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginVertical: 16,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  scrollContent: {
    paddingRight: 20,
    gap: 16,
  },

  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },



  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },

  location: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
});