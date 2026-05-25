import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { getNearbyCitiesFallback } from '../api/Service/User';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  location: Location.LocationObject | null;
  coordinates: Coordinates;
  setCoordinates: (coords: Coordinates) => void;
  address: Location.LocationGeocodedAddress | null;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  citiesList: any[];
  setCitiesList: (cities: any[]) => void;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({ latitude: 0, longitude: 0 });
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('India');
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getNearByCities = async (lat: number, lng: number) => {
    try {
      const fixedLat = Number(lat.toFixed(4));
      const fixedLng = Number(lng.toFixed(4));
      const url = `http://gd.geobytes.com/GetNearbyCities?latitude=${fixedLat}&longitude=${fixedLng}&radius=120`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      let cityList: any[] = [];
      
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        const text = await res.text();
        
        if (text && text.trim() !== '' && text.trim() !== '[["%s"]]') {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0 && data[0][1] !== '%s') {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dist = (la1: number, lo1: number, la2: number, lo2: number) => {
              const R = 6371;
              const dLa = toRad(la2 - la1);
              const dLo = toRad(lo2 - lo1);
              const a =
                Math.sin(dLa / 2) ** 2 +
                Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2;
              return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            };
            
            cityList = data
              .map((i: any) => ({ name: i[1], lat: Number(i[8]), lon: Number(i[10]) }))
              .sort((a: any, b: any) => dist(fixedLat, fixedLng, a.lat, a.lon) - dist(fixedLat, fixedLng, b.lat, b.lon));
          }
        }
      } catch (e: any) {
        clearTimeout(tid);
        console.log('⚠️ Geobytes failed, trying fallback API...');
      }

      // If Geobytes didn't return anything, use the fallback
      if (cityList.length === 0) {
        const fallback = await getNearbyCitiesFallback(fixedLat, fixedLng);
        cityList = Array.isArray(fallback) ? fallback : fallback?.data || fallback?.cities || [];
      }

      if (cityList.length > 0) {
        setCitiesList(cityList);
      }
    } catch (err) {
      console.error('❌ LocationContext: Error in getNearByCities:', err);
    }
  };

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // 1. Try to get last known position first (instant)
      let loc = await Location.getLastKnownPositionAsync({});
      if (loc) {
        setLocation(loc);
        setCoordinates({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        
        // Background reverse-geocode & nearby cities
        Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }).then(geo => {
          if (geo.length > 0) {
            setAddress(geo[0]);
            setSelectedCity(geo[0].city || geo[0].subregion || 'India');
          }
        }).catch(err => console.log('Reverse geocode error on cached loc:', err));

        getNearByCities(loc.coords.latitude, loc.coords.longitude);
      }

      // 2. Fetch current location with Balanced accuracy (faster than Highest)
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLoc);
      setCoordinates({ latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude });

      const geo = await Location.reverseGeocodeAsync({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });

      if (geo.length > 0) {
        setAddress(geo[0]);
        setSelectedCity(geo[0].city || geo[0].subregion || 'India');
      }

      await getNearByCities(currentLoc.coords.latitude, currentLoc.coords.longitude);
    } catch (e: any) {
      console.error('Error fetching location:', e);
      setError('Failed to retrieve location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        coordinates,
        setCoordinates,
        address,
        selectedCity,
        setSelectedCity,
        citiesList,
        setCitiesList,
        loading,
        error,
        refreshLocation: fetchLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
