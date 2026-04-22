import { createPremiumOrder, verifyPremiumPayment } from '@/app/api/Service/Shop';
import { getDashBoardIncome } from '@/app/api/Service/ShoperOwner';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

const { width } = Dimensions.get('window')

export default function Dashboard({
  isPremium = false,
  premiumStartDate = null,
  premiumEndDate = null
}: {
  isPremium?: boolean;
  premiumStartDate?: string | null;
  premiumEndDate?: string | null;
}) {
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState({
    isSubscribed: isPremium, // Initialize with prop
    startDate: premiumStartDate ? new Date(premiumStartDate) : null,
    endDate: premiumEndDate ? new Date(premiumEndDate) : null,
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

  // Fetch income from API - UPDATED MAPPING
  const fetchDashboardIncome = async () => {
    try {
      const response = await getDashBoardIncome()
      console.log("Dashboard income", response)

      if (response?.success && response?.dashboardIncome) {
        const income = response.dashboardIncome

        setMetrics(prev => ({
          ...prev,
          dailyIncome: Number(income.todayReceived) || 0,
          weeklyIncome: Number(income.last7Days) || 0,
          monthlyIncome: Number(income.thisMonthReceived) || 0,
          expectedIncome: Number(income.todayTotalPotential) || 0,
          // Alternative: use remaining expected amount
          // expectedIncome: Number(income.todayExpectedRemaining) || 0,
        }))
      }
    } catch (error) {
      console.log("Error fetching dashboard income:", error)
    }
  }

  useEffect(() => {
    fetchDashboardIncome()
  }, [])

  // Sync isPremium prop with state
  useEffect(() => {
    setSubscriptionData(prev => ({
      ...prev,
      isSubscribed: isPremium,
      startDate: premiumStartDate ? new Date(premiumStartDate) : prev.startDate,
      endDate: premiumEndDate ? new Date(premiumEndDate) : prev.endDate
    }))
  }, [isPremium, premiumStartDate, premiumEndDate])

  const handleSubscription = async () => {
    Alert.alert(
      "Subscription Confirmation",
      `Subscribe for ₹${subscriptionData.amount} to get premium features and top listing priority?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: async () => {
            try {
              const shopId = await AsyncStorage.getItem('shopId');
              if (!shopId) {
                Alert.alert("Error", "Shop ID not found");
                return;
              }

              // 1. Create order on backend
              const orderResponse = await createPremiumOrder(shopId);
              if (!orderResponse?.order?.id) {
                Alert.alert("Error", orderResponse?.message || "Failed to create premium order");
                return;
              }

              const options = {
                description: 'Premium Subscription',
                image: 'https://cdn.iconscout.com/icon/free/png-512/razorpay-1649771-1399875.png',
                currency: 'INR',
                key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID, // Using hardcoded key as requested
                amount: orderResponse.order.amount,
                name: 'BookMyCuts Premium',
                order_id: orderResponse.order.id,
                theme: { color: '#4F46E5' },
              };

              // 2. Open Razorpay Checkout
              RazorpayCheckout.open(options).then(async (data: any) => {
                // 3. Verify Payment
                try {
                  const verifyResponse = await verifyPremiumPayment({
                    shopId,
                    razorpay_order_id: data.razorpay_order_id,
                    razorpay_payment_id: data.razorpay_payment_id,
                    razorpay_signature: data.razorpay_signature,
                  });

                  if (verifyResponse.success) {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

                    setSubscriptionData({
                      isSubscribed: true,
                      startDate,
                      endDate,
                      amount: 799
                    });

                    Alert.alert("Success!", "Subscription activated successfully! Your account is now top-listed.");
                  } else {
                    Alert.alert("Verification Failed", verifyResponse.message || "Payment verification failed.");
                  }
                } catch (verifyErr: any) {
                  Alert.alert("Verification Error", verifyErr.message || "An error occurred during verification.");
                }
              }).catch((error: any) => {
                Alert.alert("Payment Failed", error.description || "The payment was cancelled or failed.");
              });

            } catch (err: any) {
              Alert.alert("Error", err.message || "Something went wrong while initiating payment");
            }
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
    const today = new Date().getTime()
    const diffTime = subscriptionData.endDate.getTime() - today
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
          <Text style={[styles.cardSubtext, { color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#64748B' }]}>{subtitle}</Text>
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
            <LinearGradient
              colors={['#1e1b4b', '#312e81', '#4338ca']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCard}
            >
              <View style={styles.premiumCardDecoration} />

              <View style={styles.premiumHeader}>
                <View style={styles.premiumIconContainer}>
                  <Ionicons name="diamond" size={24} color="#fbbf24" />
                </View>
                <View style={styles.premiumInfo}>
                  <Text style={styles.premiumTitle}>Premium Member</Text>
                  <Text style={styles.premiumSubtitle}>Top-listed & Exclusive features active</Text>
                </View>
              </View>

              <View style={styles.premiumDivider} />

              <View style={styles.premiumDetailsRow}>
                <View style={styles.premiumDateBlock}>
                  <Text style={styles.premiumDateLabel}>Started On</Text>
                  <Text style={styles.premiumDateValue}>
                    {formatDate(subscriptionData.startDate)}
                  </Text>
                </View>

                <View style={styles.premiumDateBlockRight}>
                  <Text style={styles.premiumDateLabel}>Valid Until</Text>
                  <Text style={styles.premiumDateValue}>
                    {formatDate(subscriptionData.endDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.premiumProgressContainer}>
                <View style={styles.premiumProgressHeader}>
                  <Text style={styles.premiumProgressText}>Time Remaining</Text>
                  <Text style={styles.premiumDaysLeft}>{getDaysRemaining()} days</Text>
                </View>
                <View style={styles.premiumProgressBarBg}>
                  <View
                    style={[
                      styles.premiumProgressBarFill,
                      { width: `${Math.min((getDaysRemaining() / 30) * 100, 100)}%` }
                    ]}
                  />
                </View>
              </View>
            </LinearGradient>
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


      </ScrollView>
    </SafeAreaView>
  )
}

// Styles remain exactly the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 1,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '400',
  },

  topListedBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  topListedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: -0.3,
    paddingBottom: 4,
  },

  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },

  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },

  // ────────────────────────────────────────────────
  // Main cards with consistent tiny border
  // ────────────────────────────────────────────────

  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderLeftColor: '#10B981',
  },

  subscriptionOfferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: (width - 48) / 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  featuredCard: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#059669', // darker green for better contrast
  },

  successCard: {
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  warningCard: {
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderColor: '#CBD5E1',
  },

  // ────────────────────────────────────────────────
  // Card inner elements
  // ────────────────────────────────────────────────

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },

  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },

  featuredValue: {
    color: '#FFFFFF',
  },

  trendIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  trendText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  subtitleContainer: {
    marginTop: 4,
  },

  cardSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },

  progressContainer: {
    marginTop: 8,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  progressPercentage: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },

  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },

  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },

  // ────────────────────────────────────────────────
  // Subscription active view
  // ────────────────────────────────────────────────

  // ────────────────────────────────────────────────
  // Premium Active Card Styles
  // ────────────────────────────────────────────────

  premiumCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumCardDecoration: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#c7d2fe',
    fontWeight: '400',
  },
  premiumDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  premiumDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  premiumDateBlock: {
    flex: 1,
  },
  premiumDateBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  premiumDateLabel: {
    fontSize: 11,
    color: '#a5b4fc',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 6,
  },
  premiumDateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  premiumProgressContainer: {
    marginTop: 4,
  },
  premiumProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumProgressText: {
    fontSize: 13,
    color: '#c7d2fe',
    fontWeight: '500',
  },
  premiumDaysLeft: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  premiumProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  premiumProgressBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },

  // ────────────────────────────────────────────────
  // Subscription offer (not subscribed)
  // ────────────────────────────────────────────────

  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  offerIconText: {
    fontSize: 20,
  },

  offerContent: {
    flex: 1,
  },

  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },

  offerDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  offerPricing: {
    alignItems: 'center',
    marginBottom: 16,
  },

  priceText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },

  priceSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  subscribeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },

  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  benefitsList: {
    alignItems: 'center',
  },

  benefitItem: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },

  // ────────────────────────────────────────────────
  // Grid + Activity
  // ────────────────────────────────────────────────

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  activityContent: {},

  activityTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },

  activityTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },

  activityAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
});