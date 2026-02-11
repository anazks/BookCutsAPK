import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BarberScheduleTimeLine = ({
  scheduleData = {
    workHours: { from: "09:00", to: "18:00" },
    breaks: [],
    bookings: [],
    freeSlots: []
  },
  totalDuration = 60,
  onTimeSelect,
}) => {
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Logic Helpers (Simplified for brevity)
  const formatTime = (time24) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const generateTimeSlots = useMemo(() => {
    const slots = [];
    const timeToMinutes = (t) => t.split(':').reduce((h, m) => h * 60 + +m);
    const minutesToTime = (m) => `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`;
    
    (scheduleData.freeSlots || []).forEach((freeSlot) => {
      const startMin = timeToMinutes(freeSlot.from);
      const endMin = timeToMinutes(freeSlot.to);
      const numSlots = Math.floor((endMin - startMin) / totalDuration);
      
      for (let i = 0; i < numSlots; i++) {
        const s = startMin + (i * totalDuration);
        const e = s + totalDuration;
        slots.push({ startTime: minutesToTime(s), endTime: minutesToTime(e) });
      }
    });
    return slots;
  }, [scheduleData, totalDuration]);

  const groupedSlots = useMemo(() => {
    const groups = { morning: [], afternoon: [], evening: [] };
    generateTimeSlots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      if (hour < 12) groups.morning.push(slot);
      else if (hour < 17) groups.afternoon.push(slot);
      else groups.evening.push(slot);
    });
    return groups;
  }, [generateTimeSlots]);

  const renderRow = (title, slots, icon) => {
    if (slots.length === 0) return null;

    return (
      <View style={styles.rowWrapper}>
        <View style={styles.rowHeader}>
          <View style={styles.headerTitleGroup}>
            {icon}
            <Text style={styles.rowTitle}>{title}</Text>
          </View>
          <View style={styles.scrollHint}>
            <Text style={styles.hintText}>SWIPE</Text>
            <Feather name="chevron-right" size={12} color="#D4AF37" />
          </View>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          snapToInterval={110} // Snap to card width + margin
          decelerationRate="fast"
          contentContainerStyle={styles.horizontalContent}
        >
          {slots.map((slot, index) => {
            const isSelected = selectedSlot?.startTime === slot.startTime;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={[styles.miniCard, isSelected && styles.miniCardSelected]}
                onPress={() => {
                    setSelectedSlot(slot);
                    if (onTimeSelect) onTimeSelect(slot);
                }}
              >
                <Text style={[styles.miniTime, isSelected && styles.selectedText]}>
                  {formatTime(slot.startTime).split(' ')[0]}
                </Text>
                <Text style={[styles.miniAmPm, isSelected && styles.selectedText]}>
                  {formatTime(slot.startTime).split(' ')[1]}
                </Text>
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Feather name="check" size={10} color="#000" />
                    </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.brandText}>GOLD LINE SCHEDULE</Text>
        <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{totalDuration} MIN</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderRow("Morning", groupedSlots.morning, <Feather name="sunrise" size={14} color="#D4AF37" />)}
        {renderRow("Afternoon", groupedSlots.afternoon, <MaterialIcons name="wb-sunny" size={14} color="#D4AF37" />)}
        {renderRow("Evening", groupedSlots.evening, <Feather name="moon" size={14} color="#D4AF37" />)}
      </ScrollView>

      {selectedSlot && (
        <View style={styles.bottomStatus}>
          <Text style={styles.statusLabel}>SELECTED START TIME</Text>
          <Text style={styles.statusValue}>{formatTime(selectedSlot.startTime)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderColor: '#111' 
  },
  brandText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  durationBadge: { borderWeight: 1, borderColor: '#D4AF37', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  durationText: { color: '#D4AF37', fontSize: 10, fontWeight: '800' },

  rowWrapper: { marginBottom: 25 },
  rowHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 12 
  },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { color: '#FFF', fontSize: 11, fontWeight: '800', marginLeft: 8, letterSpacing: 1.5, textTransform: 'uppercase' },
  scrollHint: { flexDirection: 'row', alignItems: 'center' },
  hintText: { color: '#D4AF37', fontSize: 8, fontWeight: '900', marginRight: 4 },

  horizontalContent: { paddingLeft: 20, paddingRight: 40 }, // PaddingRight extra to show "end" of row
  miniCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#222',
    width: 95, // Reduced width
    height: 70, // Reduced height
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniCardSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  miniTime: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  miniAmPm: { color: '#666', fontSize: 9, fontWeight: '700', marginTop: -2 },
  selectedText: { color: '#000' },
  checkIcon: { position: 'absolute', top: 4, right: 4 },

  bottomStatus: { 
    backgroundColor: '#0A0A0A', 
    padding: 15, 
    borderTopWidth: 2, 
    borderColor: '#D4AF37',
    alignItems: 'center'
  },
  statusLabel: { color: '#444', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  statusValue: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 2 }
});

export default BarberScheduleTimeLine;