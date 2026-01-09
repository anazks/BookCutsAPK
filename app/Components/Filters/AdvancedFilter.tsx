import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const FILTER_OPTIONS = [
  {
    id: '1',
    title: 'Best Offers',
    subtitle: 'Up to 50% OFF',
    icon: 'flash',
    color: '#EF4444', // Theme red
    iconColor: '#FFFFFF',
    badge: '🔥',
    active: true,
  },
  {
    id: '2',
    title: 'Most Booked',
    subtitle: 'Popular picks',
    icon: 'trending-up',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '📈',
    active: false,
  },
  {
    id: '3',
    title: 'Nearby You',
    subtitle: 'Within 5km',
    icon: 'location',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '📍',
    active: false,
  },
  {
    id: '4',
    title: 'Top Rated',
    subtitle: '4.5+ stars',
    icon: 'star',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '⭐',
    active: false,
  },
  {
    id: '5',
    title: 'New Arrivals',
    subtitle: 'Recently added',
    icon: 'time',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '🆕',
    active: false,
  },
  {
    id: '6',
    title: 'Express Service',
    subtitle: 'Quick service',
    icon: 'rocket',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '⚡',
    active: false,
  },
  {
    id: '7',
    title: 'Budget',
    subtitle: 'Under ₹500',
    icon: 'wallet',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '💰',
    active: false,
  },
  {
    id: '8',
    title: 'Luxury',
    subtitle: 'Premium salons',
    icon: 'diamond',
    color: '#F8FAFC',
    iconColor: '#EF4444',
    badge: '💎',
    active: false,
  },
];

export default function AdvancedFilter() {
  const [filters, setFilters] = useState(FILTER_OPTIONS);

  const handleFilterPress = (id) => {
    const updatedFilters = filters.map(filter => ({
      ...filter,
      active: filter.id === id
    }));
    setFilters(updatedFilters);
  };

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterCard,
        { 
          backgroundColor: item.color,
          borderColor: item.active ? '#EF4444' : '#E5E7EB'
        }
      ]}
      onPress={() => handleFilterPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Icon Container */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: item.active ? '#FFFFFF' : '#EF4444' }
      ]}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={item.active ? '#EF4444' : '#FFFFFF'} 
        />
      </View>

      {/* Badge */}
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{item.badge}</Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={[
          styles.filterTitle,
          { color: item.active ? '#FFFFFF' : '#111827' }
        ]}>
          {item.title}
        </Text>
        <Text style={[
          styles.filterSubtitle,
          { color: item.active ? 'rgba(255,255,255,0.9)' : '#6B7280' }
        ]}>
          {item.subtitle}
        </Text>
      </View>

      {/* Active Indicator */}
      {item.active && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={20} color="#111827" />
          <Text style={styles.headerTitle}>Advanced Filter</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} activeOpacity={0.7}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filters}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    marginTop: 8,
    paddingTop: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  filterCard: {
    width: 120,
    height: 140,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgeText: {
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterSubtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
});