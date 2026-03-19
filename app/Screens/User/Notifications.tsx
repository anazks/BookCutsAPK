import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getNotifications } from '../../api/Service/User';

const COLORS = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  primary: '#4F46E5', // Indigo to match profileBtn
  primaryBg: '#EEF2FF',
  text: '#0F172A', // Dark Navy
  textSecondary: '#64748B', // Slate gray
  textMuted: '#94A3B8',
  border: '#F1F5F9', // Very light clean border
  unreadBg: '#F8FAFF', // Slightly tinted blue for unread
  unreadDot: '#4F46E5',
  danger: '#EF4444',
};

const NOTIF_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  ARRIVAL_CHECK: { name: 'time-outline', color: '#F59E0B', bg: '#FEF3C7' },
  BOOKING_CONFIRMED: { name: 'checkmark-circle-outline', color: '#10B981', bg: '#D1FAE5' },
  BOOKING_CANCELLED: { name: 'close-circle-outline', color: '#EF4444', bg: '#FEE2E2' },
  PAYMENT: { name: 'card-outline', color: '#4F46E5', bg: '#EEF2FF' },
  REMINDER: { name: 'notifications-outline', color: '#8B5CF6', bg: '#EDE9FE' },
  DEFAULT: { name: 'notifications-outline', color: '#4F46E5', bg: COLORS.primaryBg },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const res = await getNotifications();
      if (res?.success && res.data) {
        setNotifications(res.data);
      } else if (res?.success && (!res.data || res.data.length === 0)) {
        setNotifications([]);
      } else {
        setError(res?.message || 'Failed to load notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // ── Header ────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  // ── Card ──────────────────────────────────────────────
  const renderItem = ({ item }: { item: any }) => {
    const iconCfg = NOTIF_ICONS[item.type] || NOTIF_ICONS.DEFAULT;
    const isUnread = !item.isRead;

    return (
      <View style={[styles.card, isUnread && styles.cardUnread]}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: iconCfg.bg }]}>
          <Ionicons name={iconCfg.name as any} size={22} color={iconCfg.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.timeWrap}>
              <Text style={[styles.cardTime, isUnread && styles.cardTimeUnread]}>{timeAgo(item.createdAt)}</Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          </View>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </View>
    );
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.centered}>
          <View style={styles.errorCircle}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />
          </View>
          <Text style={styles.errorTitle}>Couldn't load notifications</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()} activeOpacity={0.8}>
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      {renderHeader()}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Ionicons name="notifications-off-outline" size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>You have no notifications right now.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  listContent: { paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3,
  },

  // Card (Feed style)
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardUnread: {
    backgroundColor: COLORS.unreadBg,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.unreadDot,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  cardTitleUnread: { fontWeight: '700', color: COLORS.text },
  cardTime: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  cardTimeUnread: { color: COLORS.primary, fontWeight: '600' },
  cardBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Error
  errorCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  errorMsg: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  retryBtn: {
    marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: 12,
  },
  retryText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
});
