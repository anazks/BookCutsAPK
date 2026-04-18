import { getEarnings, requestWithdrawal } from '@/app/api/Service/Booking';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';

const COLORS = {
  primary: '#4F46E5', // Indigo
  primaryLight: '#818CF8',
  primaryBg: '#EEF2FF',
  white: '#FFFFFF',
  textMain: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  processing: '#3B82F6',
  processingBg: '#EFF6FF',
};

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

export default function PayoutScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadData = async (pageNum = 1, isRefresh = false) => {
    try {
      if (!isRefresh && pageNum === 1) setLoading(true);
      const response = await getEarnings({ 
        page: pageNum, 
        limit: 10, 
        status: statusFilter || undefined 
      });

      if (response?.success) {
        if (pageNum === 1) {
          setData(response.data);
        } else {
          setData((prev: any) => ({
            ...response.data,
            payoutHistory: [...prev.payoutHistory, ...response.data.payoutHistory]
          }));
        }
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to load earnings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(1, true);
  }, [statusFilter]);


  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { color: COLORS.success, bg: COLORS.successBg, icon: 'check-circle' };
      case 'processing': return { color: COLORS.processing, bg: COLORS.processingBg, icon: 'sync' };
      case 'failed': return { color: COLORS.danger, bg: COLORS.dangerBg, icon: 'error-outline' };
      default: return { color: COLORS.warning, bg: COLORS.warningBg, icon: 'schedule' };
    }
  };

  const formatPayoutDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.mainBalanceContainer}>
          <Text style={styles.totalEarningsLabel}>Available to Withdraw</Text>
          <Text style={styles.totalEarningsValue}>₹{data?.totalEarnings?.toLocaleString() || '0'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Settled</Text>
            <Text style={styles.statValue}>₹{data?.totalSettledAmount?.toLocaleString() || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bonus</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>₹{data?.totalPendingBonus?.toLocaleString() || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>₹{data?.totalEarnings?.toLocaleString() || '0'}</Text>
          </View>
        </View>

        <View style={styles.weeklyPayoutBadge}>
          <MaterialIcons name="info-outline" size={18} color={COLORS.primary} />
          <Text style={styles.weeklyPayoutText}>Payouts are credited monthly</Text>
        </View>
      </View>

      {/* --- CONTENT --- */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Payout History</Text>
        
        {/* Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity 
              key={opt.value} 
              style={[
                styles.filterTab, 
                statusFilter === opt.value && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(opt.value)}
            >
              <Text style={[
                styles.filterTabText, 
                statusFilter === opt.value && styles.filterTabTextActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView 
          style={styles.historyList}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color={COLORS.primary} />}
        >
          {(!data?.payoutHistory || data.payoutHistory.length === 0) ? (
            <View style={styles.emptyView}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No payout requests found</Text>
            </View>
          ) : (
            data.payoutHistory.map((item: any) => {
              const config = getStatusConfig(item.status);
              return (
                <View key={item._id} style={styles.payoutCard}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.payoutAmount}>₹{item.amount.toLocaleString()}</Text>
                      <Text style={styles.payoutDate}>{formatPayoutDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      <MaterialIcons name={config.icon as any} size={14} color={config.color} />
                      <Text style={[styles.statusText, { color: config.color }]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Breakdown Section */}
                  <View style={styles.payoutBreakdown}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Service Amount</Text>
                      <Text style={styles.breakdownValue}>₹{item.serviceAmount || 0}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Bonus Earned</Text>
                      <Text style={[styles.breakdownValue, { color: COLORS.success }]}>+₹{item.bonusAmount || 0}</Text>
                    </View>
                  </View>
                  
                  {item.utr && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>UTR:</Text>
                      <Text style={styles.detailValue}>{item.utr}</Text>
                    </View>
                  )}
                  {item.failureReason && item.status === 'failed' && (
                    <Text style={styles.errorText}>Error: {item.failureReason}</Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10, // Avoid status bar overlap
  },
  mainBalanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  totalEarningsValue: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  weeklyPayoutBadge: {
    backgroundColor: COLORS.white,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  weeklyPayoutText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  filterBar: {
    maxHeight: 40, // Reduced from 46
    marginBottom: 4, // Reduced from 8
  },
  filterBarContent: {
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'center', // Center vertically
    paddingBottom: 2, // Minimal bottom padding
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Reduced from 8
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  historyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  payoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  payoutDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  payoutBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
});