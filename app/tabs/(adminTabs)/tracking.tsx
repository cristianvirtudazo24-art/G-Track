import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getRecentLocations } from '../../../services/api';

export default function AdminTrackingScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 36) : 44, 16);

  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const locationData = await getRecentLocations();
      setLocations(locationData || []);
      setError(null);
    } catch (err) {
      console.error('Tracking Fetch Error:', err);
      setError('Unable to load tracking data.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredLocations = selectedClass === 'All'
    ? locations
    : locations.filter(loc => String(loc.student?.class) === String(selectedClass));

  // Count status stats
  const safeCount = locations.filter(loc => !loc.sos_status || loc.sos_status === 'safe').length;
  const helpCount = locations.filter(loc => loc.sos_status === 'help' || loc.sos_status === 'danger' || loc.sos_status === 'sos').length;
  const blackoutCount = locations.filter(loc => loc.sos_status === 'blackout').length;

  const centerLat = 10.2952207;
  const centerLon = 123.8955044;

  // Render Leaflet OpenStreetMap HTML content with pulsing pins
  const htmlContent = useMemo(() => {
    const studentPins = filteredLocations.map((loc) => {
      const studentInfo = loc.student || {};
      const status = String(loc.sos_status || 'safe').toLowerCase();
      const lat = Number(loc.latitude) || centerLat;
      const lon = Number(loc.longitude) || centerLon;
      const name = studentInfo.name || 'Student';
      const studentClass = studentInfo.class || 'N/A';
      return { id: loc.id, name, studentClass, status, lat, lon };
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background-color: #f8fafc; }
          .leaflet-control-container .leaflet-routing-container-hide { display: none; }
          
          .student-marker-wrapper {
            position: relative;
            width: 22px;
            height: 22px;
          }
          
          .marker-circle {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          }
          
          .status-safe { background-color: #059669; }
          .status-help { background-color: #DC2626; }
          .status-blackout { background-color: #F97316; }

          .pulse-help {
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: rgba(220, 38, 38, 0.45);
            top: -11px;
            left: -11px;
            animation: pulse-heartbeat 1.2s infinite ease-in-out;
          }

          .pulse-blackout {
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: rgba(249, 115, 22, 0.4);
            top: -9px;
            left: -9px;
            animation: pulse-heartbeat 1.8s infinite ease-in-out;
          }

          @keyframes pulse-heartbeat {
            0% { transform: scale(0.5); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
            100% { transform: scale(1.7); opacity: 0; }
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
          var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${centerLat}, ${centerLon}], 15);
          
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(map);

          var pins = ${JSON.stringify(studentPins)};
          
          pins.forEach(function(st) {
            var isHelp = st.status === 'help' || st.status === 'danger' || st.status === 'sos';
            var isBlackout = st.status === 'blackout';

            var statusClass = isHelp ? 'status-help' : (isBlackout ? 'status-blackout' : 'status-safe');
            var pulseHtml = isHelp ? '<div class="pulse-help"></div>' : (isBlackout ? '<div class="pulse-blackout"></div>' : '');
            
            var statusTag = isHelp 
              ? '<span style="color:#DC2626;font-weight:bold;">🚨 SOS Emergency</span>' 
              : (isBlackout 
                ? '<span style="color:#F97316;font-weight:bold;">⚡ Blackout Alert</span>' 
                : '<span style="color:#059669;font-weight:bold;">🟢 Safe</span>');

            var customIcon = L.divIcon({
              className: 'custom-pin-container',
              html: '<div class="student-marker-wrapper">' + pulseHtml + '<div class="marker-circle ' + statusClass + '"></div></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });

            var m = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(map);
            m.bindPopup("<div style='font-family:sans-serif;padding:2px;'>" +
              "<b style='font-size:14px;color:#111827;'>" + st.name + "</b><br>" +
              "<span style='color:#6B7280;font-size:12px;'>Class: " + st.studentClass + "</span><br>" +
              "<div style='margin-top:4px;font-size:12px;'>Status: " + statusTag + "</div>" +
              "</div>");
          });
        </script>
      </body>
      </html>
    `;
  }, [filteredLocations]);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#1E2F97']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Block with top safe area padding */}
        <View style={[styles.header, { marginTop: topInset > 24 ? 8 : 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Real-Time Tracking</Text>
            <Text style={styles.headerSubtitle}>Live student OpenStreetMap & safety status</Text>
          </View>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="shield-account" size={24} color="#1E2F97" />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Mobile Status Metric Cards */}
        <View style={styles.metricRow}>
          <View style={[styles.metricCard, styles.safeCard]}>
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#059669" />
            </View>
            <Text style={styles.metricVal}>{safeCount}</Text>
            <Text style={styles.metricLabel}>Safe</Text>
          </View>

          <View style={[styles.metricCard, styles.helpCard]}>
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
            </View>
            <Text style={[styles.metricVal, { color: '#DC2626' }]}>{helpCount}</Text>
            <Text style={[styles.metricLabel, { color: '#DC2626' }]}>Emergency</Text>
          </View>

          <View style={[styles.metricCard, styles.blackoutCard]}>
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#F97316" />
            </View>
            <Text style={[styles.metricVal, { color: '#F97316' }]}>{blackoutCount}</Text>
            <Text style={[styles.metricLabel, { color: '#F97316' }]}>Blackout</Text>
          </View>
        </View>

        {/* Class Filter Pills */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeading}>Filter by class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {['All', '2026', '2027', '2028'].map((className) => (
              <TouchableOpacity
                key={className}
                style={[styles.filterButton, selectedClass === className && styles.filterButtonActive]}
                onPress={() => setSelectedClass(className)}
              >
                <Text style={[styles.filterText, selectedClass === className && styles.filterTextActive]}>
                  {className === 'All' ? 'All Classes' : `Class ${className}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>OpenStreetMap Tracking</Text>
            <Text style={styles.mapMeta}>{filteredLocations.length} student pins</Text>
          </View>

          {/* Leaflet OpenStreetMap Container */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={htmlContent}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Admin OpenStreetMap"
              />
            ) : (
              <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webMap}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixContentMode="always"
              />
            )}
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#059669' }]} />
              <Text style={styles.legendLabel}>Safe</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.legendLabel}>Emergency</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F97316' }]} />
              <Text style={styles.legendLabel}>Blackout</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  container: { paddingBottom: 40 },
  header: {
    backgroundColor: '#1E2F97',
    margin: 16,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },
  headerBadge: { backgroundColor: '#EEF2FF', padding: 12, borderRadius: 16 },
  errorBanner: {
    backgroundColor: '#E8313A',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: '#fff', fontSize: 13, flex: 1 },
  metricRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  safeCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  helpCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  blackoutCard: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  metricIconWrap: {
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  filterSection: { marginTop: 14, marginHorizontal: 16 },
  sectionHeading: { color: '#6B7280', fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  filterList: { paddingBottom: 4 },
  filterButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  filterButtonActive: { backgroundColor: '#1E2F97', borderColor: '#1E2F97' },
  filterText: { color: '#4B5563', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  mapCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 16,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mapTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  mapMeta: { fontSize: 12, color: '#9CA3AF' },
  mapContainer: { width: '100%', height: 280, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F8FAFC' },
  webMap: { width: '100%', height: '100%', backgroundColor: '#F8FAFC' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#1E2F97', fontWeight: '600' },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280'
  },
});


