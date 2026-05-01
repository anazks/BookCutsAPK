import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GuideItem = ({ icon, title, description, highlight = false, iconType = 'Ionicons' }) => {
  const IconComponent = iconType === 'MaterialIcons' ? MaterialIcons : 
                    iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  
  return (
    <View style={styles.guideItem}>
      <View style={[styles.iconContainer, highlight && styles.highlightIcon]}>
        <IconComponent name={icon} size={22} color={highlight ? '#FFFFFF' : '#4F46E5'} />
      </View>
      <View style={styles.guideTextContent}>
        <View style={styles.titleRow}>
          <Text style={styles.guideItemTitle}>{title}</Text>
          {highlight && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>BONUS</Text>
            </View>
          )}
        </View>
        <Text style={styles.guideItemDescription}>{description}</Text>
      </View>
    </View>
  );
};

export default function ShopOwnerGuide({ onGetStarted }: { onGetStarted?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const features = [
    {
      icon: 'storefront-outline',
      title: 'Create Your Shop',
      description: 'Set up your professional business profile in minutes.',
      iconType: 'Ionicons'
    },
    {
      icon: 'people-outline',
      title: 'Manage Barbers',
      description: 'Add and manage your team of professional barbers.',
      iconType: 'Ionicons'
    },
    {
      icon: 'content-cut',
      title: 'Service Catalog',
      description: 'List your services with custom pricing and duration.',
      iconType: 'MaterialIcons'
    },
    {
      icon: 'calendar-outline',
      title: 'Booking Control',
      description: 'View all bookings with advanced filters and status tracking.',
      iconType: 'Ionicons'
    },
    {
      icon: 'bank-outline',
      title: 'Automatic Payouts',
      description: 'Add bank details to receive your earnings automatically.',
      iconType: 'MaterialCommunityIcons'
    },
    {
      icon: 'cash-outline',
      title: '₹5 Bonus per Booking',
      description: 'Get ₹5 bonus from BookMyCut for every successful booking!',
      highlight: true,
      iconType: 'Ionicons'
    },
    {
      icon: 'bar-chart-outline',
      title: 'Revenue Dashboard',
      description: 'Track daily, weekly, and monthly earnings in real-time.',
      iconType: 'Ionicons'
    },
    {
      icon: 'image-outline',
      title: 'Work Portfolio',
      description: 'Showcase your best work with high-quality images.',
      iconType: 'Ionicons'
    },
    {
      icon: 'local-offer',
      title: 'Promotional Offers',
      description: 'Create special deals to attract more customers.',
      iconType: 'MaterialIcons'
    },
    {
      icon: 'rocket-outline',
      title: 'Get Top Listed',
      description: 'Subscribe to boost your shop to the top of search results.',
      iconType: 'Ionicons'
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={toggleExpand}
        style={styles.header}
      >
        <LinearGradient
          colors={['#4F46E5', '#3730A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.mainIconContainer}>
                <Ionicons name="bulb" size={20} color="#FFD700" />
              </View>
              <View>
                <Text style={styles.headerTitle}>BookMyCuts Guide</Text>
                <Text style={styles.headerSubtitle}>Discover features to grow your business</Text>
              </View>
            </View>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#FFFFFF" 
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.featuresList}>
            {features.map((item, index) => (
              <GuideItem 
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                highlight={item.highlight}
                iconType={item.iconType}
              />
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.getStartedBtn} 
            activeOpacity={0.8}
            onPress={onGetStarted}
          >
            <Text style={styles.getStartedText}>Get Started Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  header: {
    width: '100%',
  },
  headerGradient: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  content: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  featuresList: {
    gap: 20,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  highlightIcon: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  guideTextContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  guideItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  bonusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  bonusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  guideItemDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  getStartedBtn: {
    marginTop: 24,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
