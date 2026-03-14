// components/DateSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type DateSelectorProps = {
  selectedDate: Date | null;
  onPress: () => void;
};

const normalizeDate = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatDate = (date: Date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dateNum = date.getDate();
  const year = date.getFullYear();

  return `${day}, ${dateNum} ${month} ${year}`;
};

export const DateSelector = ({ selectedDate, onPress }: DateSelectorProps) => {

  const formattedDate = selectedDate
    ? formatDate(normalizeDate(selectedDate))
    : null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Date</Text>
        <Text style={styles.subtitle}>
          Choose your preferred appointment date
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.dateCard,
          selectedDate && styles.selectedDateCard,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>

          <View
            style={[
              styles.iconContainer,
              selectedDate && styles.selectedIconContainer,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={26}
              color={selectedDate ? '#2563EB' : '#6B7280'}
            />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.label,
                selectedDate && styles.selectedLabel,
              ]}
            >
              {selectedDate ? 'Selected Date' : 'Tap to select date'}
            </Text>

            <Text
              style={[
                styles.value,
                selectedDate
                  ? styles.selectedValue
                  : styles.placeholderValue,
              ]}
            >
              {formattedDate || 'Choose appointment date'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={selectedDate ? '#2563EB' : '#9CA3AF'}
          />

        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  selectedDateCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  selectedIconContainer: {
    backgroundColor: '#DBEAFE',
  },

  textContainer: {
    flex: 1,
  },

  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },

  selectedLabel: {
    color: '#2563EB',
    fontWeight: '600',
  },

  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  selectedValue: {
    color: '#111827',
    fontWeight: '700',
  },

  placeholderValue: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default DateSelector;