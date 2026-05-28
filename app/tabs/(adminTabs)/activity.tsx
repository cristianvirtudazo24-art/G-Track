import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getRecentLocations, getStudents } from '../../../services/api';

export default function AdminActivityScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [studentData, locationData] = await Promise.all([getStudents(), getRecentLocations()]);
      setStudents(studentData || []);
      setLocations(locationData || []);
      setError(null);
    } catch (err) {
      console.error('Activity Fetch Error:', err);
      setError('Unable to load student activity.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase();
    return (
      String(student.name || '').toLowerCase().includes(query) ||
      String(student.student_id || '').toLowerCase().includes(query) ||
      String(student.class || '').toLowerCase().includes(query)
    );
  });

  const getLastLocation = (student: any) => {
    return locations.find((loc: any) => String(loc.student?.student_id) === String(student.student_id) || String(loc.student?.id) === String(student.id));
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading student activity...</Text>
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
          <Text style={styles.headerTitle}>Student Activity</Text>
          <Text style={styles.headerSubtitle}>Track the latest student status and history</Text>
        </View>

        <View style={styles.searchCard}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID or class"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{students.length}</Text>
            <Text style={styles.statsLabel}>Students</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{students.filter((s) => s.status === 'online').length}</Text>
            <Text style={styles.statsLabel}>Online</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{students.filter((s) => s.status === 'offline').length}</Text>
            <Text style={styles.statsLabel}>Offline</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.student_id ?? item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No students match your filter.</Text>}
          renderItem={({ item }) => {
            const lastLocation = getLastLocation(item);
            return (
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.statusDot, item.status === 'online' ? styles.online : styles.offline]} />
                  <View>
                    <Text style={styles.studentName}>{item.name || 'Unknown Student'}</Text>
                    <Text style={styles.studentMeta}>{item.student_id || 'N/A'} · Class {item.class || '—'}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardItem}>
                    <Text style={styles.cardItemLabel}>Battery</Text>
                    <Text style={styles.cardItemValue}>{item.battery ?? item.battery_level ?? '—'}%</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.cardItemLabel}>Signal</Text>
                    <Text style={styles.cardItemValue}>{item.signal || 'Unknown'}</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.footerLabel}>Last seen</Text>
                  <Text style={styles.footerValue}>{lastLocation ? new Date(lastLocation.recorded_at).toLocaleString() : 'No recent update'}</Text>
                </View>
              </View>
            );
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  container: { paddingBottom: 40 },
  header: { marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  searchInput: { marginLeft: 10, flex: 1, color: '#111827', fontSize: 15 },
  statsBar: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  statsItem: { flex: 1, alignItems: 'center' },
  statsNumber: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statsLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#E8313A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 13 },
  list: { paddingBottom: 40, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  online: { backgroundColor: '#059669' },
  offline: { backgroundColor: '#9CA3AF' },
  studentName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  studentMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cardItem: { flex: 1 },
  cardItemLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 6, fontWeight: '700' },
  cardItemValue: { fontSize: 15, color: '#111827', fontWeight: '700' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  footerLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  footerValue: { fontSize: 13, color: '#111827', fontWeight: '700' },
  emptyText: { color: '#9CA3AF', fontSize: 15, textAlign: 'center', marginTop: 24 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, color: '#1E2F97', fontSize: 15, fontWeight: '600' },
});
