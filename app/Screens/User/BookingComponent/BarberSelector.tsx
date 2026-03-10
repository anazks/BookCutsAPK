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
        <View style={[
          styles.avatar,
          isSelected && styles.avatarSelected,
          isAny && styles.avatarAny,
        ]}>
          <Text style={[
            styles.initial,
            isSelected && styles.initialSelected,
          ]}>
            {barber.name.charAt(0).toUpperCase()}
          </Text>

          {isAny && (
            <View style={styles.anyBadge}>
              <Ionicons name="people" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {barber.name}
        </Text>

        {!isAny && barber.nativePlace && (
          <Text style={styles.location} numberOfLines={1}>
            {barber.nativePlace}
          </Text>
        )}

        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  scrollContent: {
    paddingRight: 20,
    gap: 16,
  },

  card: {
    width: 110,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  cardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2.5,
    backgroundColor: '#F0F9FF',
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  avatarSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },

  avatarAny: {
    backgroundColor: '#8B5CF6',
  },

  initial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#64748B',
  },

  initialSelected: {
    color: '#3B82F6',
  },

  anyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },

  location: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },

  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
});