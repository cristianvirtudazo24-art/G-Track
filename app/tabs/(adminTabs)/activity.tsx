import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRecentLocations, getStudents } from '../../../services/api';

export default function AdminActivityScreen() {
  const insets = useSafeAreaInsets();
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
        <Text style={styles.loadingText}>Loading student activity logs...</Text>
      </View>
    );
  }

  const renderStudentDetail = () => {
    if (!selectedStudent) return null;

    const history = getStudentLocationHistory(selectedStudent);
    const lastLocation = history[0];
    const batteryVal = selectedStudent.battery ?? selectedStudent.battery_level;

    return (
      <View style={styles.detailContent}>
        {/* Navigation & Header */}
        <View style={styles.detailHeaderRow}>
          <Pressable style={styles.topLeftBackButton} onPress={() => setSelectedStudent(null)}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1E2F97" />
          </Pressable>
          <View style={styles.detailTextBlock}>
            <Text style={styles.detailTitle}>{getStudentDisplayName(selectedStudent)}</Text>
            <Text style={styles.detailSubtitle}>Student profile & connection telemetry</Text>
          </View>
        </View>

        {/* Overview Grid Card */}
        <View style={styles.detailGrid}>
          <View style={styles.detailCard}>
            <View style={styles.detailCardTitleRow}>
              <MaterialCommunityIcons name="account-details" size={20} color="#1E2F97" />
              <Text style={styles.detailCardHeading}>Student Overview</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>STUDENT ID</Text>
                <Text style={styles.detailValue}>{selectedStudent.student_id || selectedStudent.id || 'N/A'}</Text>
              </View>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>CLASS</Text>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{selectedStudent.class ? `Class ${selectedStudent.class}` : '—'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>GENDER</Text>
                <Text style={styles.detailValue}>{selectedStudent.gender || '—'}</Text>
              </View>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>CONTACT NUMBER</Text>
                <Text style={styles.detailLink}>{selectedStudent.contact || selectedStudent.phone || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>BATTERY TELEMETRY</Text>
                <View style={[
                  styles.batteryPill,
                  batteryVal !== undefined && batteryVal < 20 ? styles.batteryLow : batteryVal < 50 ? styles.batteryMed : styles.batteryHigh
                ]}>
                  <MaterialCommunityIcons 
                    name={batteryVal !== undefined && batteryVal < 20 ? "battery-alert" : batteryVal < 50 ? "battery-50" : "battery-check"} 
                    size={14} 
                    color={batteryVal !== undefined && batteryVal < 20 ? "#DC2626" : batteryVal < 50 ? "#D97706" : "#15803D"} 
                  />
                  <Text style={[
                    styles.batteryText,
                    { color: batteryVal !== undefined && batteryVal < 20 ? "#DC2626" : batteryVal < 50 ? "#D97706" : "#15803D" }
                  ]}>{batteryVal !== undefined && batteryVal !== null ? `${batteryVal}%` : '—'}</Text>
                </View>
              </View>
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>SIGNAL STATUS</Text>
                <View style={styles.signalBadge}>
                  <MaterialCommunityIcons name="wifi" size={14} color="#1E2F97" />
                  <Text style={styles.signalText}>{selectedStudent.signal || (lastLocation ? lastLocation.signal || 'Strong' : 'No signal')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Location Timeline */}
        <View style={styles.historyCard}>
          <View style={styles.historyTitleRow}>
            <MaterialCommunityIcons name="history" size={22} color="#1E2F97" />
            <Text style={styles.historyTitle}>Location Logs & Timeline</Text>
          </View>
          <Text style={styles.historySubtitle}>Historical GPS pings and emergency activity records.</Text>

          {history.length > 0 ? (
            history.map((item: any, index: number) => {
              const isHelp = item.status === 'help' || item.status === 'emergency';
              const isBlackout = item.status === 'blackout';
              const isSafe = item.status === 'safe' || !item.status;

              return (
                <View key={String(item.id ?? index)} style={styles.timelineRow}>
                  <View style={styles.timelineIconCol}>
                    <View style={[
                      styles.timelineDot,
                      isHelp ? styles.dotRed : isBlackout ? styles.dotOrange : styles.dotGreen
                    ]}>
                      <MaterialCommunityIcons 
                        name={isHelp ? "alert-circle" : isBlackout ? "flash-off" : "check-circle"} 
                        size={14} 
                        color="#FFF" 
                      />
                    </View>
                    {index < history.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineMeta}>
                    <Text style={styles.timelineTime}>{new Date(item.recorded_at).toLocaleString()}</Text>
                    <Text style={styles.timelineLocation}>{item.address || item.location || 'Location Coordinates Logged'}</Text>
                  </View>
                  <View style={styles.timelineStatusRow}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: isHelp ? '#FEE2E2' : isBlackout ? '#FFEDD5' : '#DCFCE7' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: isHelp ? '#DC2626' : isBlackout ? '#C2410C' : '#15803D' }
                      ]}>{item.status ? item.status.toUpperCase() : 'SAFE'}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-off" size={36} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No recent location history for this student.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (selectedStudent) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 12) : 0 }]}>
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
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 12) : 0 }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#1E2F97']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="account-group" size={28} color="#FFF" />
            <Text style={styles.headerTitle}>Student Activity</Text>
          </View>
          <Text style={styles.headerSubtitle}>Monitor student roster, connection status, & GPS history</Text>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchCard}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, ID or class..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {/* Metrics Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statsItem}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="account-multiple" size={18} color="#1E40AF" />
            </View>
            <View>
              <Text style={styles.statsNumber}>{students.length}</Text>
              <Text style={styles.statsLabel}>Total Roster</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="wifi-check" size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.statsNumber}>{students.filter((s) => s.status === 'online').length}</Text>
              <Text style={styles.statsLabel}>Online</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="wifi-off" size={18} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.statsNumber}>{students.filter((s) => s.status === 'offline').length}</Text>
              <Text style={styles.statsLabel}>Offline</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Student Table */}
        <View style={styles.tableSection}>
          <View style={styles.tableSectionHeader}>
            <MaterialCommunityIcons name="table-account" size={22} color="#1E2F97" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.tableSectionTitle}>Student Telemetry Directory</Text>
              <Text style={styles.tableSectionSubtitle}>Real-time student status, battery levels, & location logs</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Name</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Student ID</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Class</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Gender</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Battery</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Signal</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Last Update</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Contact</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Action</Text>
              </View>

              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const lastLocation = getLastLocation(student);
                  const bat = student.battery ?? student.battery_level;

                  return (
                    <View key={String(student.student_id ?? student.id ?? index)} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                      <Text style={[styles.tableCellBold, { flex: 1.4 }]} numberOfLines={1}>{getStudentDisplayName(student)}</Text>
                      <Text style={[styles.tableCellCode, { flex: 1 }]} numberOfLines={1}>{student.student_id || student.id || 'N/A'}</Text>
                      <Text style={[styles.tableCell, { flex: 0.9 }]} numberOfLines={1}>{student.class || '—'}</Text>
                      <Text style={[styles.tableCell, { flex: 0.9 }]} numberOfLines={1}>{student.gender || '—'}</Text>
                      
                      <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        <View style={[styles.statusBadge, { backgroundColor: student.status === 'online' ? '#DCFCE7' : '#F1F5F9' }]}>
                          <View style={[styles.statusDot, { backgroundColor: student.status === 'online' ? '#16A34A' : '#94A3B8' }]} />
                          <Text style={[styles.statusText, { color: student.status === 'online' ? '#15803D' : '#64748B' }]}>
                            {student.status === 'online' ? 'Online' : 'Offline'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.tableCell, { flex: 0.9 }]} numberOfLines={1}>
                        {bat !== undefined && bat !== null ? `${bat}%` : '—'}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1.1 }]} numberOfLines={1}>{student.signal || '—'}</Text>
                      <Text style={[styles.tableCellMuted, { flex: 1.3 }]} numberOfLines={1}>
                        {lastLocation ? new Date(lastLocation.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No pings'}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>{student.contact || student.phone || '—'}</Text>
                      
                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <Pressable style={styles.viewHistoryButton} onPress={() => setSelectedStudent(student)}>
                          <Text style={styles.viewHistoryButtonText}>History</Text>
                          <MaterialCommunityIcons name="chevron-right" size={14} color="#FFF" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="account-search-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyStateText}>No students match your filter criteria.</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingTop: 12, paddingBottom: 40 },
  header: {
    backgroundColor: '#1E2F97',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '500' },
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { marginLeft: 10, flex: 1, color: '#0F172A', fontSize: 14, fontWeight: '500' },
  statsBar: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statsItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  statIconBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statsNumber: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statsLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  statsDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 12,
  },
  errorText: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 13, fontWeight: '500' },
  tableSection: { marginHorizontal: 16, marginTop: 24 },
  tableSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tableSectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  tableSectionSubtitle: { fontSize: 12, color: '#64748B', marginTop: 1, fontWeight: '500' },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    minWidth: 920,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 12 },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  tableRowEven: { backgroundColor: '#FAFAFA' },
  tableCell: { fontSize: 12, color: '#334155', fontWeight: '500', paddingHorizontal: 6 },
  tableCellBold: { fontSize: 13, color: '#0F172A', fontWeight: '700', paddingHorizontal: 6 },
  tableCellCode: { fontSize: 12, color: '#1E40AF', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', paddingHorizontal: 6 },
  tableCellMuted: { fontSize: 11, color: '#64748B', fontWeight: '500', paddingHorizontal: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, justifyContent: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyState: { paddingVertical: 36, justifyContent: 'center', alignItems: 'center', width: '100%' },
  emptyStateText: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 8 },
  detailContent: { paddingBottom: 40, paddingTop: 4 },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 18 },
  topLeftBackButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  detailTextBlock: { flex: 1 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  detailSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  detailGrid: { marginHorizontal: 16, marginBottom: 16 },
  detailCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, elevation: 2, shadowColor: '#1E2F97', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  detailCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailCardHeading: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 14 },
  detailField: { flex: 1 },
  detailLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  detailLink: { fontSize: 14, color: '#1E40AF', fontWeight: '700' },
  classBadge: { backgroundColor: '#EFF6FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start' },
  classBadgeText: { color: '#1E40AF', fontWeight: '800', fontSize: 12 },
  batteryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start' },
  batteryHigh: { backgroundColor: '#DCFCE7' },
  batteryMed: { backgroundColor: '#FEF3C7' },
  batteryLow: { backgroundColor: '#FEE2E2' },
  batteryText: { fontWeight: '800', fontSize: 12 },
  signalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start' },
  signalText: { color: '#1E2F97', fontWeight: '700', fontSize: 12 },
  historyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, elevation: 2, shadowColor: '#1E2F97', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  historySubtitle: { fontSize: 12, color: '#64748B', marginBottom: 16, fontWeight: '500' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  timelineIconCol: { width: 30, alignItems: 'center', marginRight: 8 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotGreen: { backgroundColor: '#16A34A' },
  dotRed: { backgroundColor: '#DC2626' },
  dotOrange: { backgroundColor: '#EA580C' },
  timelineLine: { width: 2, height: 36, backgroundColor: '#E2E8F0', marginTop: 4 },
  timelineMeta: { flex: 1, paddingRight: 8 },
  timelineTime: { fontSize: 11, color: '#64748B', fontWeight: '700', marginBottom: 2 },
  timelineLocation: { fontSize: 13, color: '#0F172A', fontWeight: '600', lineHeight: 18 },
  timelineStatusRow: { justifyContent: 'flex-start' },
  viewHistoryButton: { backgroundColor: '#1E2F97', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewHistoryButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#1E2F97', fontSize: 14, fontWeight: '600' },
});

