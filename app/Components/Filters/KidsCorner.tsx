import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const kidsServices = [
  {
    id: '1',
    name: 'Boys Fade',
    apiName: 'Fade',
    icon: 'cut-outline' as const,
    desc: 'Sharp & stylish',
    tag: 'Popular',
    image: 'https://i.pinimg.com/originals/c5/95/63/c59563084990b7ce2e6697fb64f6ea8d.jpg',
    accent: '#2563EB',
    lightBg: '#EFF6FF',
  },
  {
    id: '2',
    name: 'Girls Bob',
    apiName: 'Bob Cut',
    icon: 'color-wand-outline' as const,
    desc: 'Cute & easy care',
    tag: 'Trending',
    image: 'https://i.pinimg.com/originals/9a/fe/df/9afedf1d1401eb4c2df79b5c9c896467.jpg',
    accent: '#059669',
    lightBg: '#ECFDF5',
  },
  {
    id: '3',
    name: 'Spiky Look',
    apiName: 'Spikes',
    icon: 'star-outline' as const,
    desc: 'Cool styling',
    tag: 'Fun',
    image: 'https://tailoringinhindi.com/wp-content/uploads/2023/02/Girl-Kids-Curly-Haircut-Styles.jpg',
    accent: '#D97706',
    lightBg: '#FFFBEB',
  },
  {
    id: '4',
    name: 'First Cut',
    apiName: 'First Haircut',
    icon: 'ribbon-outline' as const,
    desc: 'Certificate included',
    tag: 'Special',
    image: 'https://content.latest-hairstyles.com/wp-content/uploads/galleries/01/20/playful-spiky-texture-cut-for-energetic-kids.jpg',
    accent: '#7C3AED',
    lightBg: '#F5F3FF',
  },
];

export default function KidsCorner({
  onServiceChange,
}: {
  onServiceChange: (name: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePress = (apiName: string) => {
    const next = selected === apiName ? null : apiName;
    setSelected(next);
    onServiceChange(next);
  };

  const selectedItem = kidsServices.find((s) => s.apiName === selected);

  return (
    <View style={styles.wrapper}>

      {/* ── Section header ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Kids Corner</Text>
        </View>
        <Text style={styles.headerSub}>Ages 2–12</Text>
      </View>

      {/* ── Horizontal filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {kidsServices.map((s) => {
          const isSelected = selected === s.apiName;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => handlePress(s.apiName)}
              activeOpacity={0.78}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: s.accent, borderColor: s.accent }
                  : { backgroundColor: '#FFF', borderColor: '#E2E8F0' },
              ]}
            >
              <Ionicons
                name={s.icon}
                size={13}
                color={isSelected ? '#FFF' : s.accent}
              />
              <Text style={[styles.chipText, { color: isSelected ? '#FFF' : '#374151' }]}>
                {s.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={12} color="rgba(255,255,255,0.85)" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Cards ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardScroll}
        decelerationRate="fast"
        snapToInterval={148}
        snapToAlignment="start"
      >
        {kidsServices.map((s) => {
          const isSelected = selected === s.apiName;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => handlePress(s.apiName)}
              activeOpacity={0.84}
              style={[
                styles.card,
                isSelected && { borderColor: s.accent, borderWidth: 1.5 },
              ]}
            >
              {/* Image */}
              <View style={styles.imgWrap}>
                <Image
                  source={{ uri: s.image }}
                  style={styles.img}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(15,23,42,0.55)']}
                  style={styles.imgGrad}
                />

                {/* Tag */}
                <View style={[styles.tagBadge, { backgroundColor: s.lightBg }]}>
                  <Text style={[styles.tagText, { color: s.accent }]}>{s.tag}</Text>
                </View>

                {/* Checkmark */}
                {isSelected && (
                  <View style={[styles.checkDot, { backgroundColor: s.accent }]}>
                    <Ionicons name="checkmark" size={9} color="#FFF" />
                  </View>
                )}

                {/* Name over gradient */}
                <Text style={styles.imgName} numberOfLines={1}>{s.name}</Text>
              </View>

              {/* Bottom strip */}
              <View style={styles.cardBottom}>
                <View style={[styles.iconDot, { backgroundColor: s.lightBg }]}>
                  <Ionicons name={s.icon} size={11} color={s.accent} />
                </View>
                <Text style={styles.cardDesc} numberOfLines={1}>{s.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active filter banner ── */}
      {selected && selectedItem && (
        <View style={[styles.banner, { borderColor: selectedItem.lightBg }]}>
          <View style={[styles.bannerDot, { backgroundColor: selectedItem.accent }]} />
          <Text style={styles.bannerText}>
            Showing salons for{' '}
            <Text style={[styles.bannerBold, { color: selectedItem.accent }]}>
              {selectedItem.name}
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() => { setSelected(null); onServiceChange(null); }}
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
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Chips
  chipScroll: {
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 14,
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

  // Cards
  cardScroll: {
    paddingHorizontal: 14,
    gap: 10,
  },
  card: {
    width: 136,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  // Image
  imgWrap: {
    height: 106,
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
  },
  tagBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  checkDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  imgName: {
    position: 'absolute',
    bottom: 7,
    left: 8,
    right: 8,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Card bottom
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDesc: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
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