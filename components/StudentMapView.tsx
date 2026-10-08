import * as Location from 'expo-location';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/theme';

interface StudentMapViewProps {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

export const StudentMapView = ({ location, errorMsg }: StudentMapViewProps) => {
  const lat = location?.coords?.latitude ?? 10.2953;
  const lon = location?.coords?.longitude ?? 123.8955;

  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background-color: #f8fafc; }
        .leaflet-control-container .leaflet-routing-container-hide { display: none; }
        .user-location-marker {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: #1E2F97;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 10px rgba(30, 47, 151, 0.5);
        }
        .user-location-pulse {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: rgba(30, 47, 151, 0.3);
          top: -11px;
          left: -11px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-touch .leaflet-control-zoom {
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          margin-right: 12px;
          margin-bottom: 12px;
        }
        .leaflet-touch .leaflet-control-zoom a {
          border-radius: 8px !important;
          color: #1E2F97;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${lat}, ${lon}], 16);
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(map);

        var customIcon = L.divIcon({
          className: 'custom-pin-wrapper',
          html: '<div style="position:relative;"><div class="user-location-pulse"></div><div class="user-location-marker"></div></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        var marker = L.marker([${lat}, ${lon}], { icon: customIcon }).addTo(map);
        marker.bindPopup("<b>Your Location</b><br>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}");
      </script>
    </body>
    </html>
  `, [lat, lon]);

  if (errorMsg || !location) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {errorMsg || '📍 Acquiring location...'}
          </Text>
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="OpenStreetMap"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
