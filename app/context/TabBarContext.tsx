import { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

export const TabBarContext = createContext<{
  tabBarOffset: SharedValue<number>;
} | null>(null);

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
};
