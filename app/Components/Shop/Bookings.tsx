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
      completed: '#059669',
      confirmed: '#3B82F6', 
      pending: '#F59E0B',
      cancelled: '#EF4444',
      rescheduled: '#8B5CF6'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      completed: '#ECFDF5',
      confirmed: '#EFF6FF',
      pending: '#FFFBEB',
      cancelled: '#FEF2F2',
      rescheduled: '#F5F3FF'
    };
    return colors[status] || '#F9FAFB';
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

  const renderStatCard = (title, value, icon, color = '#3B82F6') => (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
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
            '#059669'
          )}
          {renderStatCard(
            'Total Bookings', 
            paymentSummary.totalBookings, 
            'event-note', 
            '#3B82F6'
          )}
          {renderStatCard(
            'Completed', 
            paymentSummary.completedBookings, 
            'check-circle', 
            '#059669'
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
            <MaterialIcons name="content-cut" size={14} color="#6B7280" />
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
            <MaterialIcons name="access-time" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{item.formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{item.time} - {item.timeSlotEnd}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{item.staff}</Text>
          </View>
          {item.duration && (
            <View style={styles.metaItem}>
              <MaterialIcons name="timer" size={16} color="#6B7280" />
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
                { backgroundColor: item.paymentStatus === 'paid' ? '#ECFDF5' : '#FEF2F2' }
              ]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: item.paymentStatus === 'paid' ? '#059669' : '#DC2626' }
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
                <MaterialIcons name="phone" size={16} color="#059669" />
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
          <ActivityIndicator size="large" color="#3B82F6" />
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
            colors={['#3B82F6']}
            tintColor="#3B82F6"
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
                <Text style={styles.emptyTitle}>No bookings found</Text>
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
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Summary Section
  summarySection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  statsRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start', // was 'center'
},

// Keep card content starting at the top
statCard: {
  alignItems: 'center',
  justifyContent: 'flex-start', // add this
  flex: 1,
  paddingHorizontal: 8,
},

  statHeader: {
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
  fontSize: 11,
  color: '#6B7280',
  fontWeight: '500',
  textAlign: 'center',
  lineHeight: 14,
  minHeight: 28, // add this
},
statContent: {
  alignItems: 'center',
},

  // Filter Section
  filterSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  filterContainer: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Bookings Section
  bookingsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  
  // Booking Card
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    minHeight: 60, // Ensure consistent height
  },
  customerSection: {
    flex: 1,
    marginRight: 16, // Add right margin to prevent touching
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  serviceName: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  priceSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 80, // Ensure consistent width
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  paidAmount: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },

  // Meta Section
  metaSection: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
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
    minWidth: 0, // Allow shrinking
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
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
    fontWeight: '700',
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
    color: '#3B82F6',
    fontWeight: '600',
  },
  expandButton: {
    padding: 4,
  },

  // Expanded Section
  expandedSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
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
    borderRadius: 10,
    gap: 6,
  },
  primaryBtn: {
    backgroundColor: '#3B82F6',
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
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});