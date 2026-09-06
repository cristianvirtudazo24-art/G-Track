import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getRecentLocations, getStudents } from '../../../services/api';

export default function AdminActivityScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

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

  const getStudentDisplayName = (student: any) => {
    if (!student) return 'Unknown';
    const nestedStudent = student.student || {};
    const firstName = student.first_name || nestedStudent.first_name;
    const lastName = student.last_name || nestedStudent.last_name;
    const joinedName = [firstName, lastName].filter(Boolean).join(' ');
    return (
      student.name ||
      student.studentName ||
      student.student_name ||
      student.full_name ||
      joinedName ||
      nestedStudent.name ||
      nestedStudent.studentName ||
      nestedStudent.student_name ||
      'Unknown'
    );
  };

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase();
    return (
      getStudentDisplayName(student).toLowerCase().includes(query) ||
      String(student.student_id || student.id || student.student?.student_id || student.student?.id || '').toLowerCase().includes(query) ||
      String(student.class || student.student?.class || '').toLowerCase().includes(query)
    );
  });

  const getLastLocation = (student: any) => {
    return locations.find((loc: any) => String(loc.student?.student_id) === String(student.student_id) || String(loc.student?.id) === String(student.id));
  };

  const getStudentLocationHistory = (student: any) => {
    return locations
      .filter((loc: any) => String(loc.student?.student_id) === String(student.student_id) || String(loc.student?.id) === String(student.id))
      .sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading student activity...</Text>
      </View>
    );
  }

  const renderStudentDetail = () => {
    if (!selectedStudent) return null;

    const history = getStudentLocationHistory(selectedStudent);
    const lastLocation = history[0];

    return (
      <View style={styles.detailContent}>
        <View style={styles.detailHeaderRow}>
          <Pressable style={styles.topLeftBackButton} onPress={() => setSelectedStudent(null)}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1E2F97" />
          </Pressable>
          <View style={styles.detailTextBlock}>
            <Text style={styles.detailTitle}>{getStudentDisplayName(selectedStudent) || 'Student Details'}</Text>
            <Text style={styles.detailSubtitle}>Timeline and student connection details</Text>
          </View>
        </View>

        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.detailSectionHeading}>Student overview</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>STUDENT ID</Text>
                <Text style={styles.detailValue}>{selectedStudent.student_id || selectedStudent.id || 'N/A'}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>CLASS</Text>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{selectedStudent.class || '—'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>GENDER</Text>
                <Text style={styles.detailValue}>{selectedStudent.gender || '—'}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>CONTACT</Text>
                <Text style={styles.detailLink}>{selectedStudent.contact || selectedStudent.phone || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>BATTERY LEVEL</Text>
                <View style={styles.batteryPill}>
                  <Text style={styles.batteryText}>{selectedStudent.battery ?? selectedStudent.battery_level ?? '—'}%</Text>
                </View>
              </View>
              <View>
                <Text style={styles.detailLabel}>SIGNAL STATUS</Text>
                <Text style={styles.detailValue}>{selectedStudent.signal || (lastLocation ? lastLocation.signal || '—' : 'No signal')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyTitleRow}>
            <MaterialCommunityIcons name="history" size={20} color="#1E2F97" />
            <Text style={styles.historyTitle}>Location History Logs</Text>
          </View>
          <Text style={styles.historySubtitle}>Scroll through previous GPS pings and timeline events.</Text>

          {history.length > 0 ? (
            history.map((item: any, index: number) => (
              <View key={String(item.id ?? index)} style={styles.timelineRow}>
                <View style={styles.timelineMeta}>
                  <Text style={styles.timelineTime}>{new Date(item.recorded_at).toLocaleString()}</Text>
                  <Text style={styles.timelineLocation}>{item.address || item.location || 'Unknown location'}</Text>
                </View>
                <View style={styles.timelineStatusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'safe' ? '#DCFCE7' : '#F3F4F6' }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === 'safe' ? '#059669' : '#9CA3AF' }]} />
                    <Text style={[styles.statusText, { color: item.status === 'safe' ? '#059669' : '#9CA3AF' }]}>{item.status ? item.status.toUpperCase() : 'STATUS'}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No location history available for this student.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (selectedStudent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#1E2F97']} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderStudentDetail()}
        </ScrollView>
      </SafeAreaView>
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

        <View style={styles.tableSection}>
          <View style={styles.tableSectionHeader}>
            <MaterialCommunityIcons name="pulse" size={20} color="#1E2F97" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.tableSectionTitle}>Student Activity Table</Text>
              <Text style={styles.tableSectionSubtitle}>Real-time student connection status and details</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Name</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Student ID</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Class</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Gender</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Status</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Battery</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Signal</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Last Update</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Contact</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Action</Text>
              </View>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const lastLocation = getLastLocation(student);
                  return (
                    <View key={String(student.student_id ?? student.id ?? index)} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                      <Text style={[styles.tableCell, { flex: 1.4 }]} numberOfLines={1}>{getStudentDisplayName(student)}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{student.student_id || student.id || 'N/A'}</Text>
                      <Text style={[styles.tableCell, { flex: 0.9 }]} numberOfLines={1}>{student.class || '—'}</Text>
                      <Text style={[styles.tableCell, { flex: 0.9 }]} numberOfLines={1}>{student.gender || '—'}</Text>
                      <View style={[styles.statusBadge, { flex: 0.9, backgroundColor: student.status === 'online' ? '#DCFCE7' : '#F3F4F6' }]}>
                        <View style={[styles.statusDot, { backgroundColor: student.status === 'online' ? '#059669' : '#9CA3AF' }]} />
                        <Text style={[styles.statusText, { color: student.status === 'online' ? '#059669' : '#9CA3AF' }]}>
                          {student.status === 'online' ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, { flex: 0.9 }]} numberOfLines={1}>{student.battery ?? student.battery_level ?? '—'}%</Text>
                      <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>{student.signal || '—'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>{lastLocation ? new Date(lastLocation.recorded_at).toLocaleString() : 'No update'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>{student.contact || student.phone || '—'}</Text>
                      <Pressable style={[styles.viewHistoryButton, { flex: 1.2, minWidth: 0, paddingHorizontal: 10 }]} onPress={() => setSelectedStudent(student)}>
                        <Text style={styles.viewHistoryButtonText}>View History</Text>
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No students match your filter.</Text>
                </View>
              )}
            </View>
          </ScrollView>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  container: { paddingTop: 22, paddingBottom: 40 },
  header: {
    backgroundColor: '#1E2F97',
    margin: 16,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 19 },
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
  tableSection: { marginHorizontal: 16, marginTop: 30 },
  tableSectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tableSectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  tableSectionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    minWidth: 900,
  },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 12 },
  tableHeaderCell: { fontSize: 12, fontWeight: '700', color: '#1F2937', textAlign: 'left', paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableRowEven: { backgroundColor: '#FAFBFC' },
  tableCell: { fontSize: 12, color: '#374151', fontWeight: '500', paddingHorizontal: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyState: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 18, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#EFF6FF', borderRadius: 16 },
  backButtonText: { color: '#1E2F97', marginLeft: 8, fontWeight: '700' },
  detailContent: { paddingBottom: 40, marginTop: 8 },
  detailHeader: { marginHorizontal: 16, marginBottom: 18 },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginHorizontal: 16, marginTop: 6, marginBottom: 18 },
  topLeftBackButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailTextBlock: { paddingTop: 4 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  detailSectionHeading: { fontSize: 15, color: '#6B7280', fontWeight: '700' },
  detailSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  detailGrid: { marginHorizontal: 16 },
  detailCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, elevation: 2, shadowColor: '#1E2F97', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, marginBottom: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  detailLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 6 },
  detailValue: { fontSize: 15, color: '#111827', fontWeight: '700' },
  detailLink: { fontSize: 15, color: '#1E40AF', fontWeight: '700' },
  classBadge: { backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start' },
  classBadgeText: { color: '#1E40AF', fontWeight: '800' },
  batteryPill: { backgroundColor: '#ECFDF5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start' },
  batteryText: { color: '#15803D', fontWeight: '800' },
  historyCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, elevation: 2, shadowColor: '#1E2F97', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, marginHorizontal: 16 },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginLeft: 10 },
  historySubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', alignItems: 'center' },
  timelineMeta: { flex: 1, marginRight: 12 },
  timelineTime: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginBottom: 4 },
  timelineLocation: { fontSize: 14, color: '#111827', fontWeight: '600' },
  timelineStatusRow: { alignItems: 'flex-end' },
  viewHistoryButton: { backgroundColor: '#1E40AF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tableActionCell: { flex: 0.8, backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 6, minWidth: 90 },
  tableActionText: { color: '#1E40AF', fontSize: 12, fontWeight: '700' },
  viewHistoryButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, color: '#1E2F97', fontSize: 15, fontWeight: '600' },
});
