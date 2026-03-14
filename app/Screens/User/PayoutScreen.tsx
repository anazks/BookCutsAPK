import { getEarnings } from '@/app/api/Service/Booking'; // Your API import
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function PayoutScreen() {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data function
  const loadEarnings = async () => {
    try {
      const response = await getEarnings();
      if (response && response.success) {
        setEarningsData(response.data);
      }
    } catch (error) {
      console.error("Failed to load earnings UI:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEarnings();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEarnings();
  }, []);

  // Helper function to format the backend ISO date
  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={[styles.container, styles.centerItems]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your earnings...</Text>
      </View>
    );
  }

  // Fallback if data fails
  if (!earningsData) {
    return (
      <View style={[styles.container, styles.centerItems]}>
        <Ionicons name="alert-circle-outline" size={48} color="#64748B" />
        <Text style={styles.loadingText}>Unable to load earnings right now.</Text>
      </View>
    );
  }

  // 💰 Destructure totalBonus from the backend data
  const { settledAmount, pendingAmount, totalBonus, recentTransactions } = earningsData;

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
        }
      >
        {/* Card 1: Balance Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Available Balance</Text>
            <Ionicons name="wallet" size={24} color="#2563EB" />
          </View>

          {/* Money in Bank (Settled) */}
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.bigAmount}>{settledAmount?.toFixed(2) || '0.00'}</Text>
          </View>

          {/* 🎁 NEW: Total Bonus Highlight (Only shows if they earned a bonus) */}
          {(totalBonus > 0) && (
            <View style={styles.bonusHighlightBox}>
              <View style={styles.bonusLeftWrapper}>
                <View style={styles.bonusIconCircle}>
                  <Ionicons name="gift" size={16} color="#10B981" />
                </View>
                <Text style={styles.bonusTitleText}>Total Bonus Earned</Text>
              </View>
              <Text style={styles.bonusTotalAmount}>+ ₹{totalBonus?.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Pending Money (Processing) */}
          <View style={styles.pendingRow}>
            <View style={styles.pendingLeft}>
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text style={styles.pendingText}>Processing in Queue</Text>
            </View>
            <Text style={styles.pendingAmount}>₹{pendingAmount?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Card 2: Earnings History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>

          {(!recentTransactions || recentTransactions.length === 0) ? (
            <Text style={styles.emptyText}>No earnings yet</Text>
          ) : (
            recentTransactions.map((item) => {
              const { date, time } = formatDateTime(item.date);
              const isCompleted = item.status === 'completed';

              return (
                <View key={item.bookingId} style={styles.earningRow}>
                  <View style={styles.earningLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons 
                        name={isCompleted ? "checkmark-circle" : "hourglass-outline"} 
                        size={22} 
                        color={isCompleted ? "#166534" : "#F59E0B"} 
                      />
                    </View>
                    <View>
                      <View style={styles.amountRow}>
                        <Text style={styles.earningAmount}>₹{item.amount}</Text>
                        
                        {/* 🎁 NEW: Individual Transaction Bonus Badge */}
                        {item.bonus > 0 && (
                          <View style={styles.miniBonusBadge}>
                            <Ionicons name="sparkles" size={10} color="#047857" />
                            <Text style={styles.miniBonusText}>+₹{item.bonus} Bonus</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.earningDate}>
                        {date} • {time}
                      </Text>
                      {/* Optional: Show UTR if completed */}
                      {isCompleted && item.utr && (
                        <Text style={styles.utrText}>Ref: {item.utr}</Text>
                      )}
                    </View>
                  </View>

                  {/* Dynamic Status Badge */}
                  <View style={[
                    styles.statusBadge, 
                    isCompleted ? styles.badgeSuccess : styles.badgeWarning
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      isCompleted ? styles.textSuccess : styles.textWarning
                    ]}>
                      {isCompleted ? 'Settled' : 'Pending'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Pull down to refresh • Payouts are processed via secure queue
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
  centerItems: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },

  // Main Amounts
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
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

  // 🎁 Bonus Highlight Styles
  bonusHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5', // Very light emerald background
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bonusLeftWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusIconCircle: {
    width: 28,
    height: 28,
    backgroundColor: '#D1FAE5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  bonusTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  
  // Pending Section
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // List Rows
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
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  // 🎁 Transaction Specific Adjustments
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  miniBonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  miniBonusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  earningDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  utrText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Dynamic Badges
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  textSuccess: {
    color: '#166534',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  textWarning: {
    color: '#92400E',
  },

  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  footerNote: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});