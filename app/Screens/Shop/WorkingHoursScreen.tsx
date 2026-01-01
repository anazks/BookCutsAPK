import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SHOP_ID = '68c2a50b3c9415e73fafd01b';
const BASE_URL = 'http://localhost:3002/api/shop/workingHours';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WorkingHoursScreen = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/getWorkingHoursByShop/${SHOP_ID}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      const mappedSchedule = dayNames.map((dayName, index) => {
        const backendDay = data.days.find((d: any) => d.day === index) || {
          day: index,
          isClosed: true,
          open: null,
          close: null,
          breaks: [],
        };

        return {
          id: index + 1,
          day: dayName,
          short: dayShorts[index],
          enabled: !backendDay.isClosed,
          open: backendDay.isClosed ? '09:00' : backendDay.open || '09:00',
          close: backendDay.isClosed ? '17:00' : backendDay.close || '17:00',
          breaks: backendDay.breaks.map((b: any) => ({
            id: Date.now() + Math.random(),
            start: b.start,
            end: b.end,
          })),
        };
      });

      setSchedule(mappedSchedule);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to load working hours');
      initializeDefaultSchedule();
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSchedule = () => {
    const defaultSchedule = dayNames.map((day, index) => ({
      id: index + 1,
      day,
      short: dayShorts[index],
      enabled: index >= 1 && index <= 5,
      open: '09:00',
      close: '17:00',
      breaks: [],
    }));
    setSchedule(defaultSchedule);
  };

  const toggleDay = (id: number) => {
    setSchedule(prev =>
      prev.map(day => (day.id === id ? { ...day, enabled: !day.enabled } : day))
    );
  };

  const updateTime = (id: number, field: 'open' | 'close', value: string) => {
    setSchedule(prev =>
      prev.map(day => (day.id === id ? { ...day, [field]: value } : day))
    );
  };

  const addBreak = (dayId: number) => {
    setSchedule(prev =>
      prev.map(day =>
        day.id === dayId
          ? {
              ...day,
              breaks: [...day.breaks, { id: Date.now(), start: '12:00', end: '13:00' }],
            }
          : day
      )
    );
  };

  const removeBreak = (dayId: number, breakId: number) => {
    setSchedule(prev =>
      prev.map(day =>
        day.id === dayId
          ? { ...day, breaks: day.breaks.filter((b: any) => b.id !== breakId) }
          : day
      )
    );
  };

  const updateBreak = (dayId: number, breakId: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev =>
      prev.map(day =>
        day.id === dayId
          ? {
              ...day,
              breaks: day.breaks.map((b: any) =>
                b.id === breakId ? { ...b, [field]: value } : b
              ),
            }
          : day
      )
    );
  };

  const openModal = (day: any) => setSelectedDay(day);
  const closeModal = () => setSelectedDay(null);

  const saveSchedule = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const payload = {
        shopId: SHOP_ID,
        days: schedule.map(day => ({
          day: dayNames.indexOf(day.day),
          isClosed: !day.enabled,
          open: day.enabled ? day.open : null,
          close: day.enabled ? day.close : null,
          breaks: day.breaks.map((b: any) => ({
            start: b.start,
            end: b.end,
          })),
        })),
      };

      let response = await fetch(`${BASE_URL}/updateWorkingHours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 404 || !response.ok) {
        response = await fetch(`${BASE_URL}/addWorkingHours`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error('Save failed');

      Alert.alert('Success', 'Working hours saved successfully!');
      closeModal();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save working hours');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading working hours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Business Hours</Text>
            <Text style={styles.subtitle}>Set your weekly schedule</Text>

            <View style={styles.newUserToggle}>
              <Switch value={isNewUser} onValueChange={setIsNewUser} />
              <Text style={styles.newUserLabel}>I'm a new user (show setup guide)</Text>
            </View>
          </View>

          <View style={styles.scheduleList}>
            {schedule.map(day => (
              <TouchableOpacity
                key={day.id}
                onPress={() => openModal(day)}
                style={[
                  styles.dayCard,
                  day.enabled ? styles.dayCardEnabled : styles.dayCardDisabled,
                ]}
              >
                <View style={styles.dayCardContent}>
                  <View style={styles.dayInfo}>
                    <View
                      style={[
                        styles.dayCircle,
                        day.enabled ? styles.dayCircleEnabled : styles.dayCircleDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayShort,
                          day.enabled ? styles.dayShortEnabled : styles.dayShortDisabled,
                        ]}
                      >
                        {day.short}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.dayName}>{day.day}</Text>
                      <Text style={styles.dayTime}>
                        {day.enabled ? `${day.open} - ${day.close}` : 'Closed'}
                        {day.enabled && day.breaks.length > 0 && (
                          <Text style={styles.breakCount}>
                            {' • '}{day.breaks.length} break(s)
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" color="#94a3b8" size={24} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save button is now inside ScrollView */}
          <TouchableOpacity style={styles.saveButton} onPress={saveSchedule} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Schedule</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal remains unchanged */}
      <Modal visible={!!selectedDay} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalDayCircle}>
                    <Text style={styles.modalDayShort}>{selectedDay?.short}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalDayTitle}>{selectedDay?.day}</Text>
                    <Text style={styles.modalDaySubtitle}>Configure your schedule</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <MaterialIcons name="close" color="#fff" size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Day Status</Text>
                <Switch
                  value={selectedDay?.enabled ?? false}
                  onValueChange={() => {
                    toggleDay(selectedDay.id);
                    setSelectedDay({ ...selectedDay, enabled: !selectedDay.enabled });
                  }}
                />
              </View>

              <View style={styles.modalBody}>
                {isNewUser && (
                  <View style={styles.guideBox}>
                    <Text style={styles.guideTitle}>Quick Setup Guide</Text>
                    <Text style={styles.guideText}>
                      Set your opening/closing times and add break hours if needed.
                    </Text>
                  </View>
                )}

                {selectedDay?.enabled ? (
                  <>
                    <View>
                      <Text style={styles.sectionTitle}>OPERATING HOURS</Text>
                      <View style={styles.timeSection}>
                        <View style={styles.timeInputWrapper}>
                          <Text style={styles.inputLabel}>Opening Time</Text>
                          <View style={styles.timeInputContainer}>
                            <MaterialIcons name="access-time" color="#94a3b8" size={20} style={styles.clockIcon} />
                            <TextInput
                              style={styles.timeInput}
                              value={selectedDay.open}
                              onChangeText={val => {
                                updateTime(selectedDay.id, 'open', val);
                                setSelectedDay({ ...selectedDay, open: val });
                              }}
                            />
                          </View>
                        </View>

                        <View style={styles.timeInputWrapper}>
                          <Text style={styles.inputLabel}>Closing Time</Text>
                          <View style={styles.timeInputContainer}>
                            <MaterialIcons name="access-time" color="#94a3b8" size={20} style={styles.clockIcon} />
                            <TextInput
                              style={styles.timeInput}
                              value={selectedDay.close}
                              onChangeText={val => {
                                updateTime(selectedDay.id, 'close', val);
                                setSelectedDay({ ...selectedDay, close: val });
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.breakSection}>
                      <View style={styles.breakHeader}>
                        <Text style={styles.sectionTitle}>BREAK HOURS</Text>
                        <TouchableOpacity
                          style={styles.addBreakButton}
                          onPress={() => {
                            addBreak(selectedDay.id);
                            setSelectedDay({
                              ...selectedDay,
                              breaks: [...selectedDay.breaks, { id: Date.now(), start: '12:00', end: '13:00' }],
                            });
                          }}
                        >
                          <MaterialIcons name="add-circle" color="#fff" size={18} />
                          <Text style={styles.addBreakText}>Add Break</Text>
                        </TouchableOpacity>
                      </View>

                      {selectedDay.breaks.length === 0 ? (
                        <View style={styles.noBreaks}>
                          <Text style={styles.noBreaksText}>No breaks added yet</Text>
                          <Text style={styles.noBreaksSub}>Click "Add Break" to set break times</Text>
                        </View>
                      ) : (
                        <View>
                          {selectedDay.breaks.map((brk: any, index: number) => (
                            <View key={brk.id} style={styles.breakCard}>
                              <View style={styles.breakCardHeader}>
                                <Text style={styles.breakTitle}>Break {index + 1}</Text>
                                <TouchableOpacity
                                  onPress={() => {
                                    removeBreak(selectedDay.id, brk.id);
                                    setSelectedDay({
                                      ...selectedDay,
                                      breaks: selectedDay.breaks.filter((b: any) => b.id !== brk.id),
                                    });
                                  }}
                                  style={styles.deleteBreak}
                                >
                                  <MaterialIcons name="delete" color="#fff" size={18} />
                                </TouchableOpacity>
                              </View>
                              <View style={styles.breakTimes}>
                                <View style={styles.breakTimeField}>
                                  <Text style={styles.breakLabel}>Start</Text>
                                  <TextInput
                                    style={styles.breakInput}
                                    value={brk.start}
                                    onChangeText={val => {
                                      updateBreak(selectedDay.id, brk.id, 'start', val);
                                      setSelectedDay({
                                        ...selectedDay,
                                        breaks: selectedDay.breaks.map((b: any) =>
                                          b.id === brk.id ? { ...b, start: val } : b
                                        ),
                                      });
                                    }}
                                  />
                                </View>
                                <View style={styles.breakTimeField}>
                                  <Text style={styles.breakLabel}>End</Text>
                                  <TextInput
                                    style={styles.breakInput}
                                    value={brk.end}
                                    onChangeText={val => {
                                      updateBreak(selectedDay.id, brk.id, 'end', val);
                                      setSelectedDay({
                                        ...selectedDay,
                                        breaks: selectedDay.breaks.map((b: any) =>
                                          b.id === brk.id ? { ...b, end: val } : b
                                        ),
                                      });
                                    }}
                                  />
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.closedDay}>
                    <View style={styles.closedIcon}>
                      <MaterialIcons name="access-time" color="#94a3b8" size={40} />
                    </View>
                    <Text style={styles.closedTitle}>Day is Closed</Text>
                    <Text style={styles.closedText}>Enable this day to set operating hours</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneButton} onPress={saveSchedule} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.doneButtonText}>Save & Close</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // extra space at bottom
  },
  innerContainer: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  newUserToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  newUserLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  scheduleList: {
    marginBottom: 24,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardEnabled: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  dayCardDisabled: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayCardContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayCircleEnabled: {
    backgroundColor: '#3b82f6',
  },
  dayCircleDisabled: {
    backgroundColor: '#f1f5f9',
  },
  dayShort: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dayShortEnabled: {
    color: '#fff',
  },
  dayShortDisabled: {
    color: '#94a3b8',
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  dayTime: {
    fontSize: 12,
    color: '#64748b',
  },
  breakCount: {
    color: '#f97316',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ... rest of the styles remain unchanged
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { backgroundColor: '#3b82f6', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  modalDayCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  modalDayShort: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalDayTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  modalDaySubtitle: { color: '#dbeafe', fontSize: 14 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 16, marginHorizontal: 24, marginTop: -20, borderRadius: 12 },
  toggleLabel: { color: '#fff', fontWeight: '500' },
  modalBody: { padding: 24 },
  guideBox: { backgroundColor: '#eff6ff', borderLeftWidth: 4, borderLeftColor: '#3b82f6', padding: 16, borderRadius: 8, marginBottom: 24 },
  guideTitle: { color: '#1e40af', fontWeight: 'bold', marginBottom: 4 },
  guideText: { color: '#1e40af', fontSize: 13 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  timeSection: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16 },
  timeInputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  timeInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', paddingHorizontal: 12 },
  clockIcon: { marginRight: 12 },
  timeInput: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#0f172a' },
  breakSection: { marginTop: 24 },
  breakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBreakButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f97316', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBreakText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  noBreaks: { backgroundColor: '#f8fafc', padding: 24, borderRadius: 16, alignItems: 'center' },
  noBreaksText: { color: '#64748b', fontSize: 14 },
  noBreaksSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  breakCard: { backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#fb923c', borderRadius: 16, padding: 16, marginBottom: 12 },
  breakCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakTitle: { fontSize: 12, fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase' },
  deleteBreak: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  breakTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  breakTimeField: { flex: 1, marginHorizontal: 6 },
  breakLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  breakInput: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#fb923c', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  closedDay: { paddingVertical: 48, alignItems: 'center' },
  closedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  closedTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  closedText: { fontSize: 14, color: '#64748b' },
  modalActions: { flexDirection: 'row', marginTop: 24 },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center', marginRight: 12 },
  cancelButtonText: { color: '#475569', fontWeight: '600' },
  doneButton: { flex: 1, paddingVertical: 14, backgroundColor: '#3b82f6', borderRadius: 12, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontWeight: '600' },
});

export default WorkingHoursScreen;