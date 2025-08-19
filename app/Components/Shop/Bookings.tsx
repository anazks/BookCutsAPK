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
          // Better user name handling
          const userName = booking.userDetails 
            ? `${booking.userDetails.firstName || ''} ${booking.userDetails.lastName || ''}`.trim()
            : booking.userId?.name || 'Customer';

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
        
        // Enhanced sorting: completed first, then by date
        formattedBookings.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return -1;
          if (b.status === 'completed' && a.status !== 'completed') return 1;
          return b.date - a.date;
        });
        
        // Enhanced payment summary calculation
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
      } else {
        throw new Error(response.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching bookings:', err);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load bookings. Please try again.');
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
      confirmed: '#3B82F6',
      pending: '#F59E0B',
      cancelled: '#EF4444',
      rescheduled: '#8B5CF6'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: 'check-circle',
      confirmed: 'event-available',
      pending: 'schedule',
      cancelled: 'cancel',
      rescheduled: 'update'
    };
    return icons[status] || 'help';
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

  const renderPaymentSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Business Overview</Text>
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.earningsCard]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#10B981" />
          </View>
          <Text style={styles.summaryValue}>₹{paymentSummary.totalEarnings.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.bookingsCard]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="event" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.summaryValue}>{paymentSummary.totalBookings}</Text>
          <Text style={styles.summaryLabel}>Total Bookings</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.completedCard]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="check-circle" size={24} color="#059669" />
          </View>
          <Text style={styles.summaryValue}>{paymentSummary.completedBookings}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.pendingCard]}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="pending" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.summaryValue}>₹{paymentSummary.pendingAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryLabel}>Pending Amount</Text>
        </View>
      </View>
    </View>
  );

  const renderBookingItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[
        styles.bookingCard,
        { opacity: item.status === 'cancelled' ? 0.7 : 1 }
      ]}
      onPress={() => toggleExpandBooking(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerRow}>
            <MaterialIcons name="person" size={16} color="#6B7280" />
            <Text style={styles.customerName}>{item.customer}</Text>
          </View>
          <Text style={styles.serviceName}>{item.service}</Text>
          <View style={styles.bookingMeta}>
            <MaterialIcons name="access-time" size={14} color="#6B7280" />
            <Text style={styles.timeText}>
              {item.formattedDate} • {item.time} - {item.timeSlotEnd}
            </Text>
          </View>
          {item.timeSlotName && (
            <View style={styles.slotBadge}>
              <Text style={styles.slotText}>{item.timeSlotName}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bookingRight}>
          <Text style={styles.priceText}>₹{item.price.toLocaleString('en-IN')}</Text>
          {item.amountPaid > 0 && item.amountPaid < item.price && (
            <Text style={styles.paidText}>Paid: ₹{item.amountPaid.toLocaleString('en-IN')}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <MaterialIcons 
              name={getStatusIcon(item.status)} 
              size={12} 
              color="#FFFFFF" 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {expandedBooking === item.id && (
        <View style={styles.bookingDetails}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Booking Details</Text>
          </View>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{item.duration}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="person-outline" size={16} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Staff</Text>
                <Text style={styles.detailValue}>{item.staff}</Text>
                {item.barberNativePlace && (
                  <Text style={styles.detailSubValue}>from {item.barberNativePlace}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="store" size={16} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Shop</Text>
                <Text style={styles.detailValue}>{item.shopName}</Text>
                {item.shopCity && (
                  <Text style={styles.detailSubValue}>{item.shopCity}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="payment" size={16} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={[
                  styles.detailValue,
                  { color: item.paymentStatus === 'paid' ? '#10B981' : '#EF4444' }
                ]}>
                  {item.paymentStatus.toUpperCase()}
                </Text>
                <Text style={styles.detailSubValue}>{item.paymentType} payment</Text>
              </View>
            </View>
            
            {item.customerPhone && (
              <View style={styles.detailItem}>
                <MaterialIcons name="phone" size={16} color="#6B7280" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{item.customerPhone}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <MaterialIcons name="event" size={16} color="#6B7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Booked On</Text>
                <Text style={styles.detailValue}>
                  {item.bookingTimestamp.toLocaleDateString('en-IN')}
                </Text>
                <Text style={styles.detailSubValue}>
                  {item.bookingTimestamp.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleViewDetails(item)}
            >
              <MaterialIcons name="visibility" size={18} color="#3B82F6" />
              <Text style={styles.actionButtonText}>View Full Details</Text>
            </TouchableOpacity>
            
            {item.customerPhone && (
              <TouchableOpacity style={[styles.actionButton, styles.callButton]}>
                <MaterialIcons name="phone" size={18} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Call Customer</Text>
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
        <StatusBar backgroundColor="#1F2937" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we fetch your data</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1F2937" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookings()}>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1F2937" barStyle="light-content" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Payment Summary */}
        {renderPaymentSummary()}

        {/* Filter Options */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filter Bookings</Text>
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
                  styles.filterButton,
                  activeFilter === filter.key && styles.activeFilter
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterCount,
                  activeFilter === filter.key && styles.activeFilterCount
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    activeFilter === filter.key && styles.activeFilterCountText
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeFilter === 'all' ? 'All Bookings' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Bookings`}
            </Text>
            <Text style={styles.sectionCount}>({filteredBookings.length})</Text>
          </View>
          
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No bookings found</Text>
                <Text style={styles.emptyText}>
                  {activeFilter === 'all' 
                    ? "You don't have any bookings yet. Your first booking will appear here." 
                    : `You don't have any ${activeFilter} bookings at the moment.`}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: (width - 80) / 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterContainer: {
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  bookingsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  serviceName: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 12,
    fontWeight: '500',
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  slotBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  slotText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  paidText: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 8,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookingDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsHeader: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailsGrid: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  callButton: {
    backgroundColor: '#F0FDF4',
  },
  actionButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});