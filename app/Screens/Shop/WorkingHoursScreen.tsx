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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { updateWorkinghours, getWorkingHours, addWorkingHours } from '@/app/api/Service/Shop';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WorkingHoursManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((_, index) => ({
      day: index,
      isClosed: false,
      open: 540, // 9:00 AM
      close: 1020, // 5:00 PM
      breaks: [],
    }))
  );

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    try {
      const id = await AsyncStorage.getItem('shopId');
      setShopId(id);
      
      if (id) {
        const response = await getWorkingHours(id);
        
        if (response && response.days && response.days.length > 0) {
          setWorkingHours(response.days);
          setIsNewUser(false);
        } else {
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

  const minutesToTime = (minutes) => {
    if (minutes === null) return '12:00 AM';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const timeToMinutes = (time) => {
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let totalMinutes = minutes;
    
    if (period === 'PM' && hours !== 12) {
      totalMinutes += (hours + 12) * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes += 0;
    } else {
      totalMinutes += hours * 60;
    }
    
    return totalMinutes;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const totalMinutes = hour * 60 + minute;
        times.push({ label: minutesToTime(totalMinutes), value: totalMinutes });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleToggleClosed = (dayIndex) => {
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

  const handleTimeChange = (dayIndex, field, value) => {
    const updated = [...workingHours];
    updated[dayIndex][field] = value;
    setWorkingHours(updated);
  };

  const handleAddBreak = (dayIndex) => {
    const updated = [...workingHours];
    updated[dayIndex].breaks.push({ start: 720, end: 750 });
    setWorkingHours(updated);
  };

  const handleRemoveBreak = (dayIndex, breakIndex) => {
    const updated = [...workingHours];
    updated[dayIndex].breaks.splice(breakIndex, 1);
    setWorkingHours(updated);
  };

  const handleBreakChange = (dayIndex, breakIndex, field, value) => {
    const updated = [...workingHours];
    updated[dayIndex].breaks[breakIndex][field] = value;
    setWorkingHours(updated);
  };

  const handleSaveAll = async () => {
    if (!shopId) {
      Alert.alert('Error', 'Shop ID not found');
      return;
    }

    setSaving(true);
    try {
      await addWorkingHours({ shopId, days: workingHours });
      Alert.alert('Success', 'Working hours saved successfully');
      setIsNewUser(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save working hours');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDay = async (dayIndex) => {
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

  const renderDayCard = (day, index) => {
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
              disabled={!isNewUser && !isEditing}
            />
          </View>
        </View>

        {!day.isClosed && (
          <View style={styles.dayContent}>
            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.timeLabel}>Opening Time</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={day.open}
                    onValueChange={(value) => handleTimeChange(index, 'open', value)}
                    style={styles.picker}
                    enabled={isNewUser || isEditing}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time.value} label={time.label} value={time.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.timeGroup}>
                <Text style={styles.timeLabel}>Closing Time</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={day.close}
                    onValueChange={(value) => handleTimeChange(index, 'close', value)}
                    style={styles.picker}
                    enabled={isNewUser || isEditing}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time.value} label={time.label} value={time.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.breaksSection}>
              <View style={styles.breaksSectionHeader}>
                <Text style={styles.breaksTitle}>Breaks</Text>
                {(isNewUser || isEditing) && (
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
                <View key={breakIndex} style={styles.breakItem}>
                  <View style={styles.breakTimeRow}>
                    <View style={styles.breakTimeGroup}>
                      <Text style={styles.breakLabel}>Start</Text>
                      <View style={styles.breakPickerContainer}>
                        <Picker
                          selectedValue={breakItem.start}
                          onValueChange={(value) =>
                            handleBreakChange(index, breakIndex, 'start', value)
                          }
                          style={styles.breakPicker}
                          enabled={isNewUser || isEditing}
                        >
                          {timeOptions.map((time) => (
                            <Picker.Item key={time.value} label={time.label} value={time.value} />
                          ))}
                        </Picker>
                      </View>
                    </View>

                    <View style={styles.breakTimeGroup}>
                      <Text style={styles.breakLabel}>End</Text>
                      <View style={styles.breakPickerContainer}>
                        <Picker
                          selectedValue={breakItem.end}
                          onValueChange={(value) =>
                            handleBreakChange(index, breakIndex, 'end', value)
                          }
                          style={styles.breakPicker}
                          enabled={isNewUser || isEditing}
                        >
                          {timeOptions.map((time) => (
                            <Picker.Item key={time.value} label={time.label} value={time.value} />
                          ))}
                        </Picker>
                      </View>
                    </View>

                    {(isNewUser || isEditing) && (
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
  breakTimeGroup: {
    flex: 1,
  },
  breakLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  breakPickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  breakPicker: {
    height: 40,
  },
  removeBreakButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    marginBottom: 0,
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