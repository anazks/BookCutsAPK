import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import * as Location from 'expo-location';
import Animated, { FadeInUp } from 'react-native-reanimated';

const WEATHER_API_KEY = '7d354564d2cd4d689ce41005262303';

interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
}

export default function WeatherOverlay() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = location.coords;

        const response = await fetch(
          `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`
        );
        const data = await response.json();

        if (mounted && data?.current) {
          const current = data.current;
          setWeather(current);
          
          const temp = current.temp_c;
          const condition = current.condition.text.toLowerCase();

          if (temp > 30 || condition.includes('sun') || condition.includes('hot') || condition.includes('clear')) {
            setTitle("It's hot outside! ☀️");
            setSubtitle("Protect your skin; apply sunscreen.");
          } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
            setTitle("It's raining! 🌧️");
            setSubtitle("Carry an umbrella for your hair.");
          } else if (temp < 20 || condition.includes('snow') || condition.includes('cold') || condition.includes('ice')) {
            setTitle("It's chilly! ❄️");
            setSubtitle("Keep your skin moisturized.");
          } else {
            setTitle("Perfect weather! ✨");
            setSubtitle("Great day for a fresh haircut.");
          }
        }
      } catch (error) {
        console.warn('Weather fetch error:', error);
      }
    };

    fetchWeather();
    return () => { mounted = false; };
  }, []);

  if (!weather) return null;

  return (
    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.container}>
      <View style={styles.pill}>
        <Image 
          source={{ uri: `https:${weather.condition.icon}` }} 
          style={styles.weatherIcon} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.tempContainer}>
          <Text style={styles.tempText}>
            {Math.round(weather.temp_c)}°
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5', // Whitesmoke theme as requested
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weatherIcon: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  tempContainer: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  tempText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#334155',
  },
});

