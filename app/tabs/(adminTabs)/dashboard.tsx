import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAlerts, getDashboardStats, getRecentLocations, getStudents } from '../../../services/api';

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [serverOnlineCount, setServerOnlineCount] = useState<number | undefined>(undefined);
  const [serverOfflineCount, setServerOfflineCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const stats = await getDashboardStats();
      if (stats) {
        setStudents(stats.students || []);
        setServerOnlineCount(stats.onlineCount);
        setServerOfflineCount(stats.offlineCount);
        setError(null);
      } else {
        const [studentData, locationData, alertData] = await Promise.all([
          getStudents(),
          getRecentLocations(),
          getAlerts()
        ]);
        setStudents(studentData || []);
        setLocations(locationData || []);
        setAlerts(alertData || []);
        setServerOnlineCount(undefined);
        setServerOfflineCount(undefined);
        setError(null);
      }
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setLastUpdatedDate(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError("Failed to fetch live data.");
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);


  const onlineCount = serverOnlineCount !== undefined ? serverOnlineCount : students.filter(s => s.status === 'online').length;
  const offlineCount = serverOfflineCount !== undefined ? serverOfflineCount : students.filter(s => s.status === 'offline').length;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={["#1E2F97"]} />
          }
        >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>G!Track System Monitor 👋</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="shield-account" size={26} color="#1E2F97" />
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.cardsRow}>
            <View style={[styles.cardItem, { marginBottom: 14 }]}> 
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Online Students</Text>
                </View>
                <View style={[styles.iconBadge, { backgroundColor: '#DCFCE7' }]}> 
                  <MaterialCommunityIcons name="account-check" size={22} color="#16A34A" />
                </View>
              </View>
              <Text style={[styles.cardNumberLarge, { color: '#16A34A' }]}>{onlineCount}</Text>
              <Text style={styles.cardSubtitle}>Currently online</Text>
            </View>
            <View style={[styles.cardItem, { marginBottom: 14 }]}> 
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Offline Students</Text>
                </View>
                <View style={[styles.iconBadge, { backgroundColor: '#FECACA' }]}> 
                  <MaterialCommunityIcons name="account-off" size={22} color="#DC2626" />
                </View>
              </View>
              <Text style={[styles.cardNumberLarge, { color: '#DC2626' }]}>{offlineCount}</Text>
              <Text style={styles.cardSubtitle}>Currently offline</Text>
            </View>
            <View style={styles.cardItem}> 
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Latest Update</Text>
                  <Text style={styles.cardSub}>{lastUpdatedDate || 'No date available'}</Text>
                </View>
                <View style={[styles.iconBadge, { backgroundColor: '#E5E7EB' }]}> 
                  <MaterialCommunityIcons name="clock-outline" size={22} color="#1E3A8A" />
                </View>
              </View>
              <Text style={styles.cardNumberLarge}>{lastUpdatedTime || 'N/A'}</Text>
              <Text style={styles.cardSubtitle}>Latest refresh time</Text>
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  keyboardAvoid: { flex: 1 },
  container: { paddingBottom: 40, paddingHorizontal: 16 },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerAvatar: {
    backgroundColor: '#EEF2FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statIconWrap: { padding: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#1E2F97', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  cardsContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginTop: 16,
    marginBottom: 0,
    marginHorizontal: 16,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    overflow: 'visible',
  },
  cardsRow: { flexDirection: 'column', marginTop: 0, marginBottom: 0, marginHorizontal: 0 },
  cardItem: {
    flex: 1,
    width: '100%',
    minHeight: 150,
    minWidth: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconBadge: { padding: 10, borderRadius: 16 },
  cardNumberLarge: { fontSize: 38, fontWeight: '800', color: '#111827', marginBottom: 8 },
  cardSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: '#6B7280', marginTop: 1, fontWeight: '500' },
  latestTime: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 10, fontSize: 15, color: '#1E2F97', fontWeight: '600' },
});
