import { getDashBoardIncome } from '@/app/api/Service/ShoperOwner'
import React, { useEffect, useState } from 'react'
import { Alert, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
   

const { width } = Dimensions.get('window')

export default function Dashboard() {
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState({
    isSubscribed: false, // Change to true to test subscription view
    startDate: null,
    endDate: null,
    amount: 799
  })

  const [metrics, setMetrics] = useState({
    dailyIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    expectedIncome: 0,
    totalAppointments: 24,
    completedAppointments: 18,
    newCustomers: 5,
    expenses: 6250,
    growthRate: 12.5,
    customerSatisfaction: 4.8,
  })

  // Fetch income from API
  const fetchDashboardIncome = async () => {
    try {
      const income = await getDashBoardIncome()
      console.log("Dashboard income", income.dashboardIncome)

      if (income.success && income.dashboardIncome) {
        const { today, lastWeek, monthlyAmount, todayExpectedAmount } = income.dashboardIncome
        setMetrics(prev => ({
          ...prev,
          dailyIncome: today ?? 0,
          weeklyIncome: lastWeek ?? 0,
          monthlyIncome: monthlyAmount ?? 0,
          expectedIncome: todayExpectedAmount ?? 0
        }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchDashboardIncome()
  }, [])

  const handleSubscription = () => {
    Alert.alert(
      "Subscription Confirmation",
      `Subscribe for ₹${subscriptionData.amount} to get premium features and top listing priority?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: () => {
            const startDate = new Date()
            const endDate = new Date()
            endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

            setSubscriptionData({
              isSubscribed: true,
              startDate,
              endDate,
              amount: 799
            })

            Alert.alert("Success!", "Subscription activated successfully! Your account is now top-listed.")
          }
        }
      ]
    )
  }

  const formatDate = (date) => {
    if (!date) return ''
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysRemaining = () => {
    if (!subscriptionData.endDate) return 0
    const today = new Date()
    const diffTime = subscriptionData.endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const calculatePercentage = (value, total) => {
    return Math.min((value / total) * 100, 100)
  }

  const formatCurrency = (amount) => {
    if (typeof amount !== "number") return "₹0"
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const ProgressBar = ({ progress, color = '#4F46E5' }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  )

  const StatCard = ({ title, value, subtitle, progress, progressText, trend, cardType = 'default' }) => (
    <View style={[
      styles.statCard,
      cardType === 'featured' ? styles.featuredCard : {},
      cardType === 'success' ? styles.successCard : {},
      cardType === 'warning' ? styles.warningCard : {},
    ]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={[styles.cardValue, cardType === 'featured' ? styles.featuredValue : {}]}>{value}</Text>
        </View>
        {trend && (
          <View style={[styles.trendIndicator, { backgroundColor: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#4F46E5' }]}>
            <Text style={styles.trendText}>{trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}</Text>
          </View>
        )}
      </View>

      {subtitle && (
        <View style={styles.subtitleContainer}>
          <Text style={[styles.cardSubtext, { color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280' }]}>{subtitle}</Text>
        </View>
      )}

      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>{progressText}</Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar progress={progress} color={cardType === 'success' ? '#10B981' : cardType === 'warning' ? '#F59E0B' : '#4F46E5'} />
        </View>
      )}
    </View>
  )

  const ActivityItem = ({ title, time, amount, status }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityLeft}>
        <View style={[styles.activityIndicator, { backgroundColor: status === 'success' ? '#10B981' : status === 'pending' ? '#F59E0B' : status === 'expense' ? '#EF4444' : '#4F46E5' }]} />
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
      {amount && (
        <Text style={[styles.activityAmount, { color: amount.includes('+') ? '#10B981' : '#EF4444' }]}>{amount}</Text>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Business Dashboard</Text>
            <Text style={styles.headerSubtitle}>Track your business performance in real-time</Text>
          </View>
          {subscriptionData.isSubscribed && (
            <View style={styles.topListedBadge}>
              <Text style={styles.topListedText}>★ TOP LISTED</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Subscription Section */}
        <View style={styles.section}>
          {subscriptionData.isSubscribed ? (
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionIcon}>
                  <Text style={styles.subscriptionIconText}>👑</Text>
                </View>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionTitle}>Premium Subscription Active</Text>
                  <Text style={styles.subscriptionStatus}>Your account is top-listed</Text>
                </View>
              </View>

              <View style={styles.subscriptionDetails}>
                <View style={styles.dateContainer}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Started</Text>
                    <Text style={styles.dateValue}>{formatDate(subscriptionData.startDate)}</Text>
                  </View>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Expires</Text>
                    <Text style={styles.dateValue}>{formatDate(subscriptionData.endDate)}</Text>
                  </View>
                </View>

                <View style={styles.daysRemainingContainer}>
                  <Text style={styles.daysRemainingText}>{getDaysRemaining()} days remaining</Text>
                  <ProgressBar progress={(getDaysRemaining() / 30) * 100} color="#10B981" />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.subscriptionOfferCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerIcon}>
                  <Text style={styles.offerIconText}>🚀</Text>
                </View>
                <View style={styles.offerContent}>
                  <Text style={styles.offerTitle}>Get Premium Subscription</Text>
                  <Text style={styles.offerDescription}>Get your business top-listed and unlock premium features</Text>
                </View>
              </View>

              <View style={styles.offerPricing}>
                <Text style={styles.priceText}>₹799</Text>
                <Text style={styles.priceSubtext}>per month</Text>
              </View>

              <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscription} activeOpacity={0.8}>
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              </TouchableOpacity>

              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✓ Top listing priority</Text>
                <Text style={styles.benefitItem}>✓ Premium analytics</Text>
                <Text style={styles.benefitItem}>✓ Advanced features</Text>
              </View>
            </View>
          )}
        </View>

        {/* Metrics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.gridContainer}>
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(metrics.dailyIncome)}
              subtitle="Compared to yesterday"
              trend="up"
              cardType="success"
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(metrics.monthlyIncome)}
              progress={calculatePercentage(metrics.monthlyIncome, 35000)}
              progressText="Target ₹35k"
              cardType="success"
            />
            <StatCard
              title="Weekly Revenue"
              value={formatCurrency(metrics.weeklyIncome)}
              subtitle="Compared to last week"
              trend="up"
              cardType="success"
            />
            <StatCard
              title="Expected Income"
              value={formatCurrency(metrics.expectedIncome)}
              progress={calculatePercentage(metrics.expectedIncome, 8000)}
              progressText="Budget ₹8k"
              cardType="warning"
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityCard}>
            <ActivityItem title="Payment received from Sarah Johnson" time="2 hours ago" amount="+₹500" status="success" />
            <ActivityItem title="Service appointment completed" time="Today, 11:30 AM" status="success" />
            <ActivityItem title="New customer registration" time="Yesterday, 4:15 PM" status="pending" />
            <ActivityItem title="Monthly supplies purchase" time="2 days ago" amount="-₹1,200" status="expense" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Keep your original styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingVertical: 28, paddingHorizontal: 24, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#0F172A', letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 15, color: '#64748B', marginTop: 6, fontWeight: '400' },
  topListedBadge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  topListedText: { color: '#000', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  scrollContent: { paddingBottom: 32 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#0F172A', letterSpacing: -0.3, paddingBottom: 5 },
  viewAllButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9' },
  viewAllText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  subscriptionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, borderWidth: 2, borderColor: '#10B981' },
  subscriptionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  subscriptionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  subscriptionIconText: { fontSize: 24 },
  subscriptionInfo: { flex: 1 },
  subscriptionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subscriptionStatus: { fontSize: 14, color: '#10B981', fontWeight: '500' },
  subscriptionDetails: { marginTop: 10 },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dateItem: { flex: 1, alignItems: 'center', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 12, marginHorizontal: 5 },
  dateLabel: { fontSize: 12, color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  dateValue: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  daysRemainingContainer: { marginTop: 10 },
  daysRemainingText: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 8, textAlign: 'center' },
  subscriptionOfferCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, borderWidth: 2, borderColor: '#4F46E5' },
  offerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  offerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  offerIconText: { fontSize: 24 },
  offerContent: { flex: 1 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  offerDescription: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  offerPricing: { alignItems: 'center', marginBottom: 20 },
  priceText: { fontSize: 36, fontWeight: '800', color: '#4F46E5', letterSpacing: -1 },
  priceSubtext: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  subscribeButton: { backgroundColor: '#4F46E5', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', marginBottom: 20, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  subscribeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  benefitsList: { alignItems: 'center' },
  benefitItem: { fontSize: 14, color: '#10B981', fontWeight: '500', marginBottom: 8, textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, marginBottom: 16, width: (width - 48) / 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
  featuredCard: { backgroundColor: '#10B981', shadowColor: '#4F46E5', shadowOpacity: 0.25 },
  successCard: { borderTopWidth: 3, borderTopColor: '#10B981' },
  warningCard: { borderTopWidth: 3, borderTopColor: '#F59E0B' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  featuredValue: { color: '#FFFFFF' },
  trendIndicator: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  trendText: { color: '#FFFFFF', fontWeight: '700' },
  subtitleContainer: { marginTop: 4 },
  cardSubtext: { fontSize: 12, fontWeight: '500' },
  progressContainer: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  progressPercentage: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  progressBarContainer: { width: '100%', height: 6, backgroundColor: '#E5E7EB', borderRadius: 4 },
  progressBarFill: { height: 6, borderRadius: 4 },
  activityCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  activityLeft: { flexDirection: 'row', alignItems: 'center' },
  activityIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  activityContent: {},
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  activityTime: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: '700' },
})
