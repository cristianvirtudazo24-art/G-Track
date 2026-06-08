import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { getRecentLocations } from '../../../services/api';

export default function AdminTrackingScreen() {
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

  const initialRegion = {
    latitude: 10.2952207,
    longitude: 123.8955044,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const getMarkerColor = (gender: string | null) => {
    const genderLower = String(gender || '').toLowerCase();
    if (genderLower === 'male' || genderLower === 'boy' || genderLower === 'm') {
      return '#3B82F6'; // Blue for boys
    } else if (genderLower === 'female' || genderLower === 'girl' || genderLower === 'f') {
      return '#EF4444'; // Red for girls
    }
    return '#1E2F97'; // Default color
  };

  const renderMarkers = () => filteredLocations.map((loc) => {
    const studentInfo = loc.student || {};
    const isHelp = loc.sos_status === 'help';
    const markerColor = isHelp ? '#E8313A' : getMarkerColor(studentInfo.gender);
    const coordinate = {
      latitude: Number(loc.latitude) || initialRegion.latitude,
      longitude: Number(loc.longitude) || initialRegion.longitude,
    };
    return (
      <Marker
        key={loc.id ?? `${studentInfo.student_id}-${Math.random()}`}
        coordinate={coordinate}
        title={studentInfo.name || 'Student'}
        description={`Class: ${studentInfo.class || 'N/A'}`}
      >
        <View style={[styles.markerCircle, { backgroundColor: markerColor }]}>
          <MaterialCommunityIcons name={isHelp ? 'alert-circle' : 'map-marker'} size={18} color="#fff" />
        </View>
      </Marker>
    );
  });

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
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Real-Time Tracking</Text>
            <Text style={styles.headerSubtitle}>Live student map and connectivity status</Text>
          </View>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="ray-start-arrow" size={22} color="#1E2F97" />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Student Location Map</Text>
            <Text style={styles.mapMeta}>{filteredLocations.length} pins</Text>
          </View>
          <MapView 
            style={styles.map} 
            initialRegion={initialRegion} 
            mapType="none"
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <UrlTile
              urlTemplate="https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              minimumZ={0}
              flipY={false}
            />
            {renderMarkers()}
          </MapView>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendLabel}>Boys</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendLabel}>Girls</Text>
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  summaryCardAlert: { backgroundColor: '#FEF2F2', marginRight: 0 },
  summaryLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  summaryNumber: { color: '#111827', fontSize: 24, fontWeight: '800' },
  summaryLabelAlert: { color: '#E8313A' },
  summaryNumberAlert: { color: '#E8313A' },
  filterSection: { marginTop: 18, marginHorizontal: 16 },
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
  map: { width: '100%', height: 220, borderRadius: 18 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#1E2F97', fontWeight: '600' },
  markerCircle: { width: 38, height: 38, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  markerNormal: { backgroundColor: '#1E2F97' },
  markerHelp: { backgroundColor: '#E8313A' },
  legendContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 16, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    gap: 20 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  legendColor: { 
    width: 16, 
    height: 16, 
    borderRadius: 8 
  },
  legendLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#6B7280' 
  },
});

