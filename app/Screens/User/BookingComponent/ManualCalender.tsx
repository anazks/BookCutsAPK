import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 380);
const DAY_CELL_SIZE = Math.floor((CALENDAR_WIDTH - 16) / 7); // 16 = padding*2

interface ManualCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  isVisible: boolean;
  onClose: () => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDate = (date: Date) => {
  const day = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear()}`;
};

export default function ManualCalendar({
  selectedDate,
  onDateSelect,
  isVisible,
  onClose,
}: ManualCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible]);

  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number) =>
    new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const isToday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === new Date().toDateString();
  };

  const isPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < new Date() && !isToday(day);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    );
  };

  const handleDayPress = (day: number | null) => {
    if (!day || isPast(day)) return;
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
    onClose();
  };

  const canGoBack = () => {
    const now = new Date();
    return (
      currentYear > now.getFullYear() ||
      (currentYear === now.getFullYear() && currentMonth > now.getMonth())
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.calendarContainer, { opacity: fadeAnim }]}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.navButton, !canGoBack() && styles.navButtonDisabled]}
              onPress={goToPreviousMonth}
              disabled={!canGoBack()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={canGoBack() ? '#1E293B' : '#CBD5E1'}
              />
            </TouchableOpacity>

            <View style={styles.monthYearContainer}>
              <Text style={styles.monthYearText}>
                {months[currentMonth]} {currentYear}
              </Text>
              {selectedDate && (
                <Text style={styles.selectedDatePreview}>
                  {formatDate(selectedDate)}
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
              <Ionicons name="chevron-forward" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Weekdays */}
          <View style={styles.weekdaysRow}>
            {weekdays.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const today = isToday(day);
              const past = isPast(day);
              const selected = isSelected(day);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    today && styles.todayCell,
                    past && styles.pastCell,
                    selected && styles.selectedCell,
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={past}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      today && styles.todayText,
                      past && styles.pastText,
                      selected && styles.selectedText,
                    ]}
                  >
                    {day}
                  </Text>
                  {today && !selected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: CALENDAR_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  selectedDatePreview: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  weekdayCell: {
    width: DAY_CELL_SIZE,         // ✅ fixed width instead of flex:1
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayCell: {
    width: DAY_CELL_SIZE,         // ✅ exact 1/7 of grid width, no margin
    height: DAY_CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  todayCell: {
    backgroundColor: '#EFF6FF',
  },
  pastCell: {
    opacity: 0.4,
  },
  selectedCell: {
    backgroundColor: '#2563EB',
  },
  dayText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  todayText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  pastText: {
    color: '#94A3B8',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '60%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});