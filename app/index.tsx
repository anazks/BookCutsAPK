import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const [hasShopId, setHasShopId] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, category, shopId] = await Promise.all([
          AsyncStorage.getItem('accessToken'),
          AsyncStorage.getItem('userCategory'),
          AsyncStorage.getItem('shopId'),
        ]);

        setHasToken(!!token);
        setUserCategory(category);
        setHasShopId(!!shopId);
      } catch (e) {
        console.error('Error checking auth state:', e);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  // Smart Redirection
  if (hasToken) {
    // If shop owner (category or shopId fallback), go to shop home
    if (userCategory === 'shop' || hasShopId) {
      return <Redirect href="/ShopOwner/shopOwnerHome" />;
    }
    // Default for clients
    return <Redirect href="/(tabs)/Home" />;
  } else {
    return <Redirect href="/Home" />;
  }
}
