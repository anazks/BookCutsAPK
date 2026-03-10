// components/ShopHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ShopHeaderProps = {
  shopName: string;
};

export const ShopHeader = ({ shopName }: ShopHeaderProps) => {
  return (
    <View style={styles.headerSection}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="arrow-back" size={24} color="#1E293B" />
      </TouchableOpacity>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {shopName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,           // ← improved spacing
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 21,      // ← slightly larger → more premium feel
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
});