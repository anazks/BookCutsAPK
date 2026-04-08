import { fetchUniqueServices } from '@/app/api/Service/User';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ServiceItem = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  lightBg: string;
};

const serviceConfig: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  lightBg: string;
}> = {
  All: { icon: 'apps-outline', accent: '#2563EB', lightBg: '#EFF6FF' },
  Haircut: { icon: 'cut-outline', accent: '#DB2777', lightBg: '#FDF2F8' },
  Spa: { icon: 'leaf-outline', accent: '#059669', lightBg: '#ECFDF5' },
  CarWash: { icon: 'car-outline', accent: '#D97706', lightBg: '#FFFBEB' },
  Repair: { icon: 'construct-outline', accent: '#7C3AED', lightBg: '#F5F3FF' },
  default: { icon: 'grid-outline', accent: '#0891B2', lightBg: '#ECFEFF' },
};

export default function ServiceFilter({
  onServiceChange,
}: {
  onServiceChange?: (name: string) => void;
}) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedId, setSelectedId] = useState('all');

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    try {
      const response = await fetchUniqueServices();

      if (response?.success && response?.service) {
        const formatted: ServiceItem[] = [
          {
            id: 'all',
            name: 'All',
            ...serviceConfig['All'],
          },
          ...response.service.map((name: string, index: number) => {
            const cfg = serviceConfig[name] ?? serviceConfig['default'];
            return {
              id: index.toString(),
              name,
              ...cfg,
            };
          }),
        ];
        setServices(formatted);
      }
    } catch (error) {
      console.log('Service fetch error:', error);
    }
  };

  const handlePress = (service: ServiceItem) => {
    setSelectedId(service.id);
    onServiceChange?.(service.name);
  };

  const selectedItem = services.find((s) => s.id === selectedId);

  return (
    <View style={styles.wrapper}>

      {/* ── Section header ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Services</Text>
        </View>
        {selectedItem && selectedItem.id !== 'all' && (
          <Text style={[styles.headerSub, { color: selectedItem.accent }]}>
            {selectedItem.name}
          </Text>
        )}
      </View>

      {/* ── Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {services.map((service) => {
          const isSelected = selectedId === service.id;
          return (
            <TouchableOpacity
              key={service.id}
              onPress={() => handlePress(service)}
              activeOpacity={0.78}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: service.accent, borderColor: service.accent }
                  : { backgroundColor: '#FFF', borderColor: '#E2E8F0' },
              ]}
            >
              <Ionicons
                name={service.icon}
                size={13}
                color={isSelected ? '#FFF' : service.accent}
              />
              <Text style={[styles.chipText, { color: isSelected ? '#FFF' : '#374151' }]}>
                {service.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={12} color="rgba(255,255,255,0.85)" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active filter banner ── */}
      {selectedItem && selectedItem.id !== 'all' && (
        <View style={[styles.banner, { borderColor: selectedItem.lightBg }]}>
          <View style={[styles.bannerDot, { backgroundColor: selectedItem.accent }]} />
          <Text style={styles.bannerText}>
            Filtering by{' '}
            <Text style={[styles.bannerBold, { color: selectedItem.accent }]}>
              {selectedItem.name}
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() => {
              const allItem = services.find((s) => s.id === 'all');
              if (allItem) handlePress(allItem);
            }}
            style={styles.clearBtn}
          >
            <Ionicons name="close" size={11} color="#64748B" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Chips
  chipScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  bannerBold: {
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
});