// components/SelectedServicesSummary.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SelectedServicesSummaryProps = {
  count: number;
  totalDuration: number;
  finalTotal: number;
};

export const SelectedServicesSummary = ({
  count,
  totalDuration,
  finalTotal,
}: SelectedServicesSummaryProps) => {
  if (count === 0) return null;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Selected Services</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {count} item{count !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.summaryDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Total Duration</Text>
            <Text style={styles.detailValue}>{totalDuration} min</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Total Cost</Text>
            <Text style={styles.detailPrice}>₹{finalTotal}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  summaryDetails: {
    paddingTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
}); 