import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { updateWorkinghours, getWorkingHours, addWorkingHours } from '@/app/api/Service/Shop';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WorkingHoursManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const [workingHours, setWorkingHours] = useState(
    DAYS.map((_, index) => ({
      day: index,
      isClosed: false,
      open: 540, // 9:00 AM in minutes
      close: 1020, // 5:00 PM in minutes
      breaks: [] as { start: number; end: number }[],
    }))
  );

  // State for controlling which time picker is visible
  const [showPicker, setShowPicker] = useState<{
    dayIndex: number | null;
    field: 'open' | 'close' | 'break-start' | 'break-end' | null;
    breakIndex?: number;
  }>({ dayIndex: null, field: null });

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    try {
      const id = await AsyncStorage.getItem('shopId');
      setShopId(id);

      if (id) {
        const response = await getWorkingHours(id);
        console.log('API Response:', response);

        const daysData = response?.result?.days || response?.days;

        if (daysData && Array.isArray(daysData) && daysData.length > 0) {
          console.log('Loaded working hours:', daysData);
          setWorkingHours(daysData);
          setIsNewUser(false);
        } else {
          console.log('No working hours found, treating as new user');
          setIsNewUser(true);
        }
      }
    } catch (error) {
      console.error('Error loading working hours:', error);
      setIsNewUser(true);
    } finally {
      setLoading(false);
    }
  };

  const minutesToTime = (minutes: number | null) => {
    if (minutes === null) return 'Closed';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const minutesToDate = (minutes: number): Date => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setMinutes(minutes);
    return date;
  };

  const dateToMinutes = (date: Date): number => {
    return date.getHours() * 60 + date.getMinutes();
  };

  const handleToggleClosed = (dayIndex: number) => {
    const updated = [...workingHours];
    updated[dayIndex].isClosed = !updated[dayIndex].isClosed;
    if (updated[dayIndex].isClosed) {
      updated[dayIndex].open = null;
      updated[dayIndex].close = null;
      updated[dayIndex].breaks = [];
    } else {
      updated[dayIndex].open = 540;
      updated[dayIndex].close = 1020;
    }
    setWorkingHours(updated);
  };

  const handleTimeSelected = (selectedDate?: Date) => {
    if (!selectedDate || showPicker.dayIndex === null || showPicker.field === null) {
      setShowPicker({ dayIndex: null, field: null });
      return;
    }

    const minutes = dateToMinutes(selectedDate);
    const { dayIndex, field, breakIndex } = showPicker;

    const updated = [...workingHours];

    if (field === 'open') {
      updated[dayIndex].open = minutes;
    } else if (field === 'close') {
      updated[dayIndex].close = minutes;
    } else if (field === 'break-start' && breakIndex !== undefined) {
      updated[dayIndex].breaks[breakIndex].start = minutes;
    } else if (field === 'break-end' && breakIndex !== undefined) {
      updated[dayIndex].breaks[breakIndex].end = minutes;
    }

    setWorkingHours(updated);
    setShowPicker({ dayIndex: null, field: null });
  };

  const handleAddBreak = (dayIndex: number) => {
    const updated = [...workingHours];
    updated[dayIndex].breaks.push({ start: 720, end: 750 }); // 12:00 - 12:30
    setWorkingHours(updated);
  };

  const handleRemoveBreak = (dayIndex: number, breakIndex: number) => {
    const updated = [...workingHours];
    updated[dayIndex].breaks.splice(breakIndex, 1);
    setWorkingHours(updated);
  };

  const handleSaveAll = async () => {
    if (!shopId) {
      Alert.alert('Error', 'Shop ID not found');
      return;
    }

    setSaving(true);
    try {
      await addWorkingHours(shopId, workingHours);
      Alert.alert('Success', 'Working hours saved successfully');
      setIsNewUser(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save working hours');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDay = async (dayIndex: number) => {
    if (!shopId) {
      Alert.alert('Error', 'Shop ID not found');
      return;
    }

    setSaving(true);
    try {
      const dayData = workingHours[dayIndex];
      const payload = {
        shopId,
        day: dayData.day,
        isClosed: dayData.isClosed,
        open: dayData.isClosed ? null : minutesToTime(dayData.open),
        close: dayData.isClosed ? null : minutesToTime(dayData.close),
        breaks: dayData.breaks.map(b => ({
          start: minutesToTime(b.start),
          end: minutesToTime(b.end),
        })),
      };

      await updateWorkinghours(payload);
      Alert.alert('Success', `${DAYS[dayIndex]} updated successfully`);
      setEditingDay(null);
    } catch (error) {
      Alert.alert('Error', `Failed to update ${DAYS[dayIndex]}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const canEdit = (index: number) => isNewUser || editingDay === index;

  const renderTimeField = (
    value: number | null,
    label: string,
    onPress: () => void,
    disabled: boolean
  ) => (
    <View style={styles.timeGroup}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.timeDisplay, disabled && styles.timeDisplayDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.timeDisplayText}>
          {value !== null ? minutesToTime(value) : 'Select time'}
        </Text>
        <Ionicons name="time-outline" size={20} color="#6366F1" />
      </TouchableOpacity>
    </View>
  );

  const renderDayCard = (day: typeof workingHours[0], index: number) => {
    const isEditing = editingDay === index;

    return (
      <View key={index} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleRow}>
            <Text style={styles.dayName}>{DAYS[index]}</Text>
            {!isNewUser && !isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingDay(index)}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.closedToggle}>
            <Text style={styles.closedLabel}>
              {day.isClosed ? 'Closed' : 'Open'}
            </Text>
            <Switch
              value={!day.isClosed}
              onValueChange={() => handleToggleClosed(index)}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
              disabled={!canEdit(index)}
            />
          </View>
        </View>

        {!day.isClosed && (
          <View style={styles.dayContent}>
            <View style={styles.timeRow}>
              {renderTimeField(
                day.open,
                'Opening Time',
                () => canEdit(index) && setShowPicker({ dayIndex: index, field: 'open' }),
                !canEdit(index)
              )}

              {renderTimeField(
                day.close,
                'Closing Time',
                () => canEdit(index) && setShowPicker({ dayIndex: index, field: 'close' }),
                !canEdit(index)
              )}
            </View>

            <View style={styles.breaksSection}>
              <View style={styles.breaksSectionHeader}>
                <Text style={styles.breaksTitle}>Breaks</Text>
                {canEdit(index) && (
                  <TouchableOpacity
                    style={styles.addBreakButton}
                    onPress={() => handleAddBreak(index)}
                  >
                    <Ionicons name="add-circle" size={20} color="#6366F1" />
                    <Text style={styles.addBreakText}>Add Break</Text>
                  </TouchableOpacity>
                )}
              </View>

              {day.breaks.map((breakItem, breakIndex) => (
                <View key={`break-${index}-${breakIndex}`} style={styles.breakItem}>
                  <View style={styles.breakTimeRow}>
                    {renderTimeField(
                      breakItem.start,
                      'Start',
                      () =>
                        canEdit(index) &&
                        setShowPicker({
                          dayIndex: index,
                          field: 'break-start',
                          breakIndex,
                        }),
                      !canEdit(index)
                    )}

                    {renderTimeField(
                      breakItem.end,
                      'End',
                      () =>
                        canEdit(index) &&
                        setShowPicker({
                          dayIndex: index,
                          field: 'break-end',
                          breakIndex,
                        }),
                      !canEdit(index)
                    )}

                    {canEdit(index) && (
                      <TouchableOpacity
                        style={styles.removeBreakButton}
                        onPress={() => handleRemoveBreak(index, breakIndex)}
                      >
                        <Ionicons name="trash" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {day.breaks.length === 0 && (
                <Text style={styles.noBreaksText}>No breaks added</Text>
              )}
            </View>

            {!isNewUser && isEditing && (
              <View style={styles.dayActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingDay(null);
                    loadWorkingHours();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveDayButton}
                  onPress={() => handleUpdateDay(index)}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveDayButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Time Picker Modal */}
        {showPicker.dayIndex === index && showPicker.field && (
          <DateTimePicker
            value={
              showPicker.field === 'open'
                ? minutesToDate(workingHours[index].open ?? 540)
                : showPicker.field === 'close'
                ? minutesToDate(workingHours[index].close ?? 1020)
                : showPicker.field === 'break-start' && showPicker.breakIndex !== undefined
                ? minutesToDate(workingHours[index].breaks[showPicker.breakIndex].start)
                : minutesToDate(workingHours[index].breaks[showPicker.breakIndex!].end)
            }
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => handleTimeSelected(date)}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading working hours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Working Hours</Text>
        <Text style={styles.headerSubtitle}>
          {isNewUser ? 'Set your business hours' : 'Manage your schedule'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {workingHours.map((day, index) => renderDayCard(day, index))}

        {isNewUser && (
          <TouchableOpacity
            style={styles.saveAllButton}
            onPress={handleSaveAll}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveAllButtonText}>Save All Working Hours</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#6366F1',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  scrollView: {
    flex: 1,
  },
  dayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dayHeader: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dayContent: {
    padding: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  timeDisplayDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  timeDisplayText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  breaksSection: {
    marginTop: 8,
  },
  breaksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breaksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  addBreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBreakText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  breakItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  removeBreakButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  noBreaksText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  dayActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveDayButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveAllButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveAllButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 32,
  },
});

export default WorkingHoursManager;