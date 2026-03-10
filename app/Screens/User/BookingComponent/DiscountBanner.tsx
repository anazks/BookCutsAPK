// components/DiscountBanner.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DiscountBannerProps = {
  discountAmount: number;
  // You can add more props later if needed (e.g. referralCode, expiryDate)
};

export const DiscountBanner = ({ discountAmount }: DiscountBannerProps) => {
  if (discountAmount <= 0) return null;

  return (
    <View style={styles.discountBanner}>
      {/* Left accent bar for visual interest */}
      <View style={styles.accentBar} />

      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift-outline" size={24} color="#065F46" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Referral Discount Applied!</Text>
          <Text style={styles.subtitle}>
            You saved <Text style={styles.highlight}>₹{discountAmount}</Text> on this booking
          </Text>
        </View>
      </View>

      <View style={styles.amountBadge}>
        <Text style={styles.amountText}>−₹{discountAmount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  discountBanner: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#10B981',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
  },
  highlight: {
    fontWeight: '700',
    color: '#065F46',
  },
  amountBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 16,
    alignSelf: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
}); 