import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PayoutScreen() {
  // Sample data — replace with real data from API / state
  const weeklyEarnings = 40;
  const earningsList = [
    { id: 1, amount: 20, date: '23 Mar 2026', time: '10:30 AM' },
    { id: 2, amount: 20, date: '22 Mar 2026', time: '2:15 PM' },
    // Add more entries as needed
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card 1: Weekly Earnings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week's Earnings</Text>
            <Ionicons name="wallet-outline" size={24} color="#2563EB" />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.bigAmount}>{weeklyEarnings}</Text>
          </View>

          <Text style={styles.cardSubtitle}>
            Earnings from {earningsList.length} completed services
          </Text>
        </View>

        {/* Card 2: Earnings History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Earnings</Text>

          {earningsList.length === 0 ? (
            <Text style={styles.emptyText}>No earnings yet this week</Text>
          ) : (
            earningsList.map((item) => (
              <View key={item.id} style={styles.earningRow}>
                <View style={styles.earningLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="cash-outline" size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.earningAmount}>₹{item.amount}</Text>
                    <Text style={styles.earningDate}>
                      {item.date} • {item.time}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Optional note */}
        <Text style={styles.footerNote}>
          Payouts are processed every Sunday • Minimum ₹200 required
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Card common style
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Weekly amount
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },

  currency: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 4,
  },

  bigAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2563EB',
  },

  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },

  // Earnings list row
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  earningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  earningAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },

  earningDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },

  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Footer note
  footerNote: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },
});