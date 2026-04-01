/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  men: {
    primary: '#1A1F36',
    accent: '#1877F2',
    background: 'transparent',
    text: '#11181C',
    headerBackground: '#1A1F36',
    headerText: '#FFFFFF',
    subText: 'rgba(255, 255, 255, 0.8)',
  },
  womens: {
    primary: '#BE185D',     // Rich deep pink for depth
    accent: '#F472B6',      // Light, vivid pink for accents
    background: 'transparent',
    text: '#11181C',
    headerBackground: '#DB2777', // Soft medium pink
    headerText: '#FFFFFF',
    subText: 'rgba(255, 255, 255, 0.9)',
  },
  kids: {
    primary: '#D97706',
    accent: '#F59E0B',
    background: 'transparent',
    text: '#11181C',
    headerBackground: '#D97706',
    headerText: '#FFFFFF',
    subText: 'rgba(255, 255, 255, 0.9)',
  },
};

