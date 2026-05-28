import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getRecentLocations, getStudents } from '../../../services/api';

export default function AdminTrackingScreen() {
  const [locations, setLocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [studentData, locationData] = await Promise.all([getStudents(), getRecentLocations()]);
      setStudents(studentData || []);
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

  const onlineCount = students.filter((s: any) => s.status === 'online').length;
  const offlineCount = students.filter((s: any) => s.status === 'offline').length;
  const emergencyCount = locations.filter(loc => loc.sos_status === 'help').length;

  const initialRegion = {
    latitude: 10.2952207,
    longitude: 123.8955044,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const renderMarkers = () => filteredLocations.map((loc) => {
    const studentInfo = loc.student || {};
    const isHelp = loc.sos_status === 'help';
    const coordinate = {
      latitude: Number(loc.latitude) || initialRegion.latitude,
      longitude: Number(loc.longitude) || initialRegion.longitude,
    };
    return (
      <Marker
        key={loc.id ?? `${studentInfo.student_id}-${Math.random()}`}
        coordinate={coordinate}
      >
        <View style={[styles.markerCircle, isHelp ? styles.markerHelp : styles.markerNormal]}>
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

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Online</Text>
            <Text style={styles.summaryNumber}>{onlineCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Offline</Text>
            <Text style={styles.summaryNumber}>{offlineCount}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAlert]}>
            <Text style={[styles.summaryLabel, styles.summaryLabelAlert]}>Alerts</Text>
            <Text style={[styles.summaryNumber, styles.summaryNumberAlert]}>{emergencyCount}</Text>
          </View>
        </View>

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
          <MapView style={styles.map} initialRegion={initialRegion}>
            {renderMarkers()}
          </MapView>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Recent Student Activity</Text>
          {filteredLocations.slice(0, 5).map((loc) => {
            const studentInfo = loc.student || {};
            const statusText = loc.sos_status === 'help' ? 'Emergency' : 'Safe';
            return (
              <View key={loc.id} style={styles.activityRow}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityName}>{studentInfo.name || 'Unknown'}</Text>
                  <Text style={styles.activityMeta}>{studentInfo.student_id || 'N/A'} · {studentInfo.class || '—'}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={[styles.activityStatus, loc.sos_status === 'help' ? styles.activityStatusAlert : styles.activityStatusOk]}>
                    {statusText}
                  </Text>
                  <Text style={styles.activityTime}>{new Date(loc.recorded_at).toLocaleTimeString()}</Text>
                </View>
              </View>
            );
          })}
          {filteredLocations.length === 0 ? <Text style={styles.emptyText}>No location updates found.</Text> : null}
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
  listCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  activityLeft: { flex: 1, marginRight: 10 },
  activityName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  activityMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  activityRight: { alignItems: 'flex-end' },
  activityStatus: { fontSize: 11, fontWeight: '800', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, overflow: 'hidden' },
  activityStatusOk: { color: '#059669', backgroundColor: '#D1FAE5' },
  activityStatusAlert: { color: '#B91C1C', backgroundColor: '#FEE2E2' },
  activityTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  emptyText: { marginTop: 10, color: '#9CA3AF', textAlign: 'center', fontSize: 14 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#1E2F97', fontWeight: '600' },
  markerCircle: { width: 38, height: 38, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  markerNormal: { backgroundColor: '#1E2F97' },
  markerHelp: { backgroundColor: '#E8313A' },
});
