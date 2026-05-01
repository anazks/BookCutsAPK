import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: { lat: number; lng: number }) => void;
  initialCoords: { lat: number; lng: number };
}

const getMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; overflow: hidden; background: #f8fafc; }
        html, body, #map { height: 100%; width: 100%; }
        .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            width: 30px;
            height: 40px;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" class="center-marker" />
    <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        function sendLocation() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: center.lat, lng: center.lng }));
        }

        map.on('moveend', sendLocation);
        setTimeout(sendLocation, 500);
    </script>
</body>
</html>
`;

export default function LocationPickerModal({ visible, onClose, onConfirm, initialCoords }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(initialCoords);
  const webViewRef = useRef<any>(null);
  const searchTimeout = useRef<any>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
          { headers: { 'User-Agent': 'BookCutsApp/1.0' } }
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    }, 800);
  };

  const selectSearchResult = (result: any) => {
    const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    const jsCode = `map.setView([${coords.lat}, ${coords.lng}], 15);`;
    webViewRef.current?.injectJavaScript(jsCode);
    setCurrentCoords(coords);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleLocateMe = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
      const jsCode = `map.setView([${coords.lat}, ${coords.lng}], 15);`;
      webViewRef.current?.injectJavaScript(jsCode);
      setCurrentCoords(coords);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Shop Location</Text>
          <TouchableOpacity 
            onPress={() => onConfirm(currentCoords)} 
            style={styles.confirmHeaderButton}
          >
            <Text style={styles.confirmHeaderText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for area or street..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity onPress={handleLocateMe} style={styles.locateIcon}>
            <Ionicons name="locate" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getMapHtml(initialCoords.lat, initialCoords.lng) }}
            onMessage={(event) => {
              const data = JSON.parse(event.nativeEvent.data);
              setCurrentCoords(data);
            }}
          />
          
          {searchResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.map((res, i) => (
                  <TouchableOpacity key={i} style={styles.resultItem} onPress={() => selectSearchResult(res)}>
                    <Text style={styles.resultText} numberOfLines={2}>{res.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.coordBadge}>
            <Text style={styles.coordText}>
              {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.helperText}>Drag the map to place the pin exactly on your shop.</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={() => onConfirm(currentCoords)}>
            <Text style={styles.confirmButtonText}>Confirm This Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 20, color: '#64748b' },
  confirmHeaderButton: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  confirmHeaderText: { color: '#fff', fontWeight: '700' },
  searchWrapper: { padding: 12, flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  locateIcon: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, justifyContent: 'center' },
  mapContainer: { flex: 1, position: 'relative' },
  resultsDropdown: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  resultItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultText: { fontSize: 14, color: '#334155' },
  coordBadge: {
    position: 'absolute',
    bottom: 20, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#ddd'
  },
  coordText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  helperText: { textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 16 },
  confirmButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
