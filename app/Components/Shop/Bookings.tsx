import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getShopBookings } from '../../api/Service/Shop';

const { width, height } = Dimensions.get('window');

export default function Bookings() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState({
    totalEarnings: 0,
    totalBookings: 0,
    paidBookings: 0,
    pendingAmount: 0,
    completedBookings: 0
  });

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const response = await getShopBookings();
      
      if (response.success && response.data) {
        const formattedBookings = response.data.map(booking => {
          const userName = booking.userDetails 
            ? `${booking.userDetails.firstName || ''} ${booking.userDetails.lastName || ''}`.trim()
            : booking.userId?.firstName || 'Customer';

          return {
            id: booking._id,
            customer: userName,
            customerPhone: booking.userDetails?.mobileNo || 'N/A',
            customerEmail: booking.userDetails?.email || 'N/A',
            service: booking.services?.map(s => s.name).join(', ') || 'Service',
            serviceIds: booking.serviceIds || [],
            date: new Date(booking.bookingDate),
            formattedDate: new Date(booking.bookingDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            time: booking.timeSlotStart,
            timeSlotName: booking.timeSlotName,
            timeSlotEnd: booking.timeSlotEnd,
            duration: `${booking.totalDuration || 0} mins`,
            price: parseFloat(booking.totalPrice) || 0,
            amountPaid: parseFloat(booking.amountPaid) || 0,
            remainingAmount: parseFloat(booking.remainingAmount) || 0,
            status: booking.bookingStatus?.toLowerCase() || 'pending',
            staff: booking.barberName || 'Staff',
            barberNativePlace: booking.barberNativePlace || '',
            paymentStatus: booking.paymentStatus?.toLowerCase() || 'pending',
            paymentType: booking.paymentType || 'full',
            paymentId: booking.paymentId || '',
            shopName: booking.shopDetails?.ShopName || 'Shop',
            shopCity: booking.shopDetails?.City || '',
            shopMobile: booking.shopDetails?.Mobile || '',
            bookingTimestamp: new Date(booking.bookingTimestamp),
            currency: booking.currency || 'INR'
          };
        });
        
        formattedBookings.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return -1;
          if (b.status === 'completed' && a.status !== 'completed') return 1;
          return b.date - a.date;
        });
        
        const summary = formattedBookings.reduce((acc, booking) => {
          acc.totalBookings += 1;
          
          if (booking.status === 'completed') {
            acc.completedBookings += 1;
          }
          
          if (booking.paymentStatus === 'paid') {
            acc.totalEarnings += booking.amountPaid;
            acc.paidBookings += 1;
          } else {
            acc.pendingAmount += booking.price - booking.amountPaid;
          }
          
          return acc;
        }, {
          totalEarnings: 0,
          totalBookings: 0,
          paidBookings: 0,
          pendingAmount: 0,
          completedBookings: 0
        });
        
        setBookings(formattedBookings);
        setPaymentSummary(summary);
      } else if (response.success && (!response.data || response.data.length === 0)) {
        // Success but empty data: treat as no bookings (no error, just empty list)
        setBookings([]);
        setPaymentSummary({
          totalEarnings: 0,
          totalBookings: 0,
          paidBookings: 0,
          pendingAmount: 0,
          completedBookings: 0
        });
      } else {
        // !success: handle based on status code
        let errorMsg = 'Failed to fetch bookings';
        if (response.statusCode === 404) {
          errorMsg = 'Something went wrong. Please check your connection and try again.';
        } else if (response.statusCode === 500) {
          errorMsg = 'Server error. Please try again later.';
        } else if (response.message) {
          errorMsg = response.message;
        }
        setError(errorMsg);
        console.error('API Error:', response);
        if (!isRefresh) {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      console.error('Error fetching bookings:', err);
      if (!isRefresh) {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings(true);
  }, [fetchBookings]);

  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'all') return true;
    return booking.status === activeFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10B981',
      confirmed: '#4F46E5', 
      pending: '#F59E0B',
      cancelled: '#EF4444',
      rescheduled: '#8B5CF6'
    };
    return colors[status] || '#64748B';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      completed: '#F0FDF4',
      confirmed: '#EFF6FF',
      pending: '#FEF3C7',
      cancelled: '#FEF2F2',
      rescheduled: '#F3E8FF'
    };
    return colors[status] || '#F1F5F9';
  };

  const toggleExpandBooking = (id) => {
    setExpandedBooking(expandedBooking === id ? null : id);
  };

  const handleViewDetails = (booking) => {
    Alert.alert(
      'Booking Details',
      `Customer: ${booking.customer}\nService: ${booking.service}\nDate: ${booking.formattedDate}\nPrice: ₹${booking.price}`,
      [{ text: 'OK' }]
    );
  };

  const renderStatCard = (title, value, icon, color = '#4F46E5') => (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '10' }]}>
            <MaterialIcons name={icon} size={20} color={color} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </Text>
            <Text style={styles.statLabel} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPaymentSummary = () => (
    <View style={styles.summarySection}>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          {renderStatCard(
            'Total Earnings', 
            `₹${paymentSummary.totalEarnings.toLocaleString('en-IN')}`, 
            'account-balance-wallet', 
            '#10B981'
          )}
          {renderStatCard(
            'Total Bookings', 
            paymentSummary.totalBookings, 
            'event-note', 
            '#4F46E5'
          )}
          {renderStatCard(
            'Completed', 
            paymentSummary.completedBookings, 
            'check-circle', 
            '#10B981'
          )}
          {renderStatCard(
            'Pending Amount', 
            `₹${paymentSummary.pendingAmount.toLocaleString('en-IN')}`, 
            'schedule', 
            '#F59E0B'
          )}
        </View>
      </View>
    </View>
  );

  const renderBookingItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => toggleExpandBooking(item.id)}
      activeOpacity={0.95}
    >
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.customerSection}>
          <Text style={styles.customerName}>{item.customer}</Text>
          <View style={styles.serviceRow}>
            <MaterialIcons name="content-cut" size={14} color="#64748B" />
            <Text style={styles.serviceName}>{item.service}</Text>
          </View>
        </View>
        
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>₹{item.price.toLocaleString('en-IN')}</Text>
          {item.amountPaid > 0 && item.amountPaid < item.price && (
            <Text style={styles.paidAmount}>₹{item.amountPaid} paid</Text>
          )}
        </View>
      </View>

      {/* Meta Information */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="access-time" size={16} color="#64748B" />
            <Text style={styles.metaText}>{item.formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={16} color="#64748B" />
            <Text style={styles.metaText}>{item.time} - {item.timeSlotEnd}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="person-outline" size={16} color="#64748B" />
            <Text style={styles.metaText}>{item.staff}</Text>
          </View>
          {item.duration && (
            <View style={styles.metaItem}>
              <MaterialIcons name="timer" size={16} color="#64748B" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: getStatusBgColor(item.status),
            borderColor: getStatusColor(item.status)
          }
        ]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        
        {item.timeSlotName && (
          <View style={styles.slotBadge}>
            <Text style={styles.slotText}>{item.timeSlotName}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => toggleExpandBooking(item.id)}
        >
          <MaterialIcons 
            name={expandedBooking === item.id ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>
      </View>

      {/* Expanded Details */}
      {expandedBooking === item.id && (
        <View style={styles.expandedSection}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{item.duration}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{item.customerPhone}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: item.paymentStatus === 'paid' ? '#F0FDF4' : '#FEF2F2' }
              ]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: item.paymentStatus === 'paid' ? '#10B981' : '#EF4444' }
                ]}>
                  {item.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shop</Text>
              <Text style={styles.detailValue}>{item.shopName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booked On</Text>
              <Text style={styles.detailValue}>
                {item.bookingTimestamp.toLocaleDateString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={() => handleViewDetails(item)}
            >
              <MaterialIcons name="visibility" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>View Details</Text>
            </TouchableOpacity>
            
            {item.customerPhone !== 'N/A' && (
              <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]}>
                <MaterialIcons name="phone" size={16} color="#10B981" />
                <Text style={styles.secondaryBtnText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookings()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Payment Summary */}
        {renderPaymentSummary()}

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {[
              { key: 'all', label: 'All', count: bookings.length },
              { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
              { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
              { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
              { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  activeFilter === filter.key && styles.activeFilterChip
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText
                ]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsSection}>
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptyText}>
                  {activeFilter === 'all' 
                    ? "Your bookings will appear here once customers start booking." 
                    : `No ${activeFilter} bookings at the moment.`}
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Summary Section
  summarySection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  statCard: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    paddingHorizontal: 8,
  },

  statHeader: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  statContent: {
    alignItems: 'center',
  },

  // Filter Section
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterContainer: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Bookings Section
  bookingsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  
  // Booking Card
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    minHeight: 60,
  },
  customerSection: {
    flex: 1,
    marginRight: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  serviceName: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  priceSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 80,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  paidAmount: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '500',
  },

  // Meta Section
  metaSection: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
    minWidth: 0,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Status Section
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  slotBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  expandButton: {
    padding: 4,
  },

  // Expanded Section
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailsGrid: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
  },
  secondaryBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryBtnText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});