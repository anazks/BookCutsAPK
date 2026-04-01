import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

type Category = 'men' | 'womens' | 'kids';

interface ThemeContextType {
  category: Category;
  setCategory: (category: Category) => void;
  theme: typeof Colors.men;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [category, setCategoryState] = useState<Category>('men');

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const savedCategory = await AsyncStorage.getItem('appCategory');
        if (savedCategory && (savedCategory === 'men' || savedCategory === 'womens' || savedCategory === 'kids')) {
          setCategoryState(savedCategory as Category);
        }
      } catch (e) {
        console.error('Failed to load category', e);
      }
    };
    loadCategory();
  }, []);

  const setCategory = async (newCategory: Category) => {
    setCategoryState(newCategory);
    try {
      await AsyncStorage.setItem('appCategory', newCategory);
    } catch (e) {
      console.error('Failed to save category', e);
    }
  };

  const theme = Colors[category];

  return (
    <ThemeContext.Provider value={{ category, setCategory, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
