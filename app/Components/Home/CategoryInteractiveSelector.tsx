import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type CategoryType = 'men' | 'womens' | 'kids';

interface CategoryConfig {
  id: CategoryType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  accentColor: string;
  glowColor: string;
  lightBg: string;
  quickTags: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'men',
    title: 'Men',
    icon: 'man',
    gradient: ['#1D4ED8', '#2563EB'],
    accentColor: '#2563EB',
    glowColor: 'rgba(37, 99, 235, 0.28)',
    lightBg: '#EFF6FF',
    quickTags: ['Haircut', 'Beard Trim', 'Fade Cut', 'Head Massage'],
  },
  {
    id: 'womens',
    title: 'Women',
    icon: 'woman',
    gradient: ['#BE185D', '#E11D48'],
    accentColor: '#E11D48',
    glowColor: 'rgba(225, 29, 72, 0.28)',
    lightBg: '#FFF1F2',
    quickTags: ['Hair Styling', 'Facial & Glow', 'Manicure', 'Hair Spa'],
  },
  {
    id: 'kids',
    title: 'Kids',
    icon: 'happy',
    gradient: ['#B45309', '#D97706'],
    accentColor: '#D97706',
    glowColor: 'rgba(217, 119, 6, 0.28)',
    lightBg: '#FFFBEB',
    quickTags: ['Junior Haircut', 'Gentle Snips', 'Cool Spikes'],
  },
];

interface Props {
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  selectedQuickFilter?: string | null;
  onSelectQuickFilter?: (filterName: string) => void;
}

export default function CategoryInteractiveSelector({
  selectedCategory,
  onSelectCategory,
  selectedQuickFilter,
  onSelectQuickFilter,
}: Props) {
  const handleCategoryPress = (cat: CategoryType) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectCategory(cat);
  };

  const handleQuickTagPress = (tag: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onSelectQuickFilter) {
      onSelectQuickFilter(tag === selectedQuickFilter ? 'All' : tag);
    }
  };

  const activeCategoryConfig =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <View style={styles.container}>
      {/* ── Compact Segmented Capsule Switcher (Only 42px high!) ── */}
      <View style={styles.switcherContainer}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => handleCategoryPress(cat.id)}
              style={[
                styles.tabTouchable,
                isSelected && {
                  shadowColor: cat.accentColor,
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                },
              ]}
            >
              {isSelected ? (
                <LinearGradient
                  colors={cat.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Ionicons name={cat.icon} size={16} color="#FFFFFF" />
                  <Text style={styles.activeTabText}>{cat.title}</Text>
                  <View style={styles.activeDot} />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <Ionicons name={cat.icon} size={15} color={cat.accentColor} />
                  <Text style={styles.inactiveTabText}>{cat.title}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Micro Quick Highlight Pills (Ultra-compact 26px) ── */}
      <View style={styles.quickTagsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickTagsScroll}
        >
          <View style={styles.tagsLeadingLabel}>
            <Ionicons name="sparkles" size={11} color={activeCategoryConfig.accentColor} />
            <Text style={[styles.tagsLeadingText, { color: activeCategoryConfig.accentColor }]}>
              Popular:
            </Text>
          </View>

          {activeCategoryConfig.quickTags.map((tag, idx) => {
            const isTagActive = selectedQuickFilter === tag;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                onPress={() => handleQuickTagPress(tag)}
                style={[
                  styles.quickTagPill,
                  isTagActive
                    ? [
                        styles.quickTagActive,
                        {
                          backgroundColor: '#0F172A',
                          borderColor: '#0F172A',
                        },
                      ]
                    : styles.quickTagInactive,
                ]}
              >
                <Text
                  style={[
                    styles.quickTagText,
                    isTagActive
                      ? styles.quickTagTextActive
                      : { color: '#475569' },
                  ]}
                >
                  {tag}
                </Text>
                {isTagActive && (
                  <Ionicons
                    name="checkmark-circle"
                    size={11}
                    color="#FFF"
                    style={{ marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tabTouchable: {
    flex: 1,
    height: 40,
    borderRadius: 11,
  },
  activeTabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    gap: 5,
    paddingHorizontal: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 1,
  },
  inactiveTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'transparent',
    gap: 5,
    paddingHorizontal: 8,
  },
  inactiveTabText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '700',
  },
  quickTagsSection: {
    marginTop: 6,
  },
  quickTagsScroll: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  tagsLeadingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 2,
  },
  tagsLeadingText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  quickTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickTagInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  quickTagActive: {
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  quickTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickTagTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
