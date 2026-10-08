import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAlerts, getDashboardStats, getRecentLocations, getStudents } from '../../../services/api';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
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
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
  const totalCount = (onlineCount || 0) + (offlineCount || 0) || students.length;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Initializing Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 12) : 0 }]}>
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
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.systemStatusPill}>
                <View style={styles.statusPulseDot} />
                <Text style={styles.systemStatusText}>G!Track System Active</Text>
              </View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>Real-time campus monitoring & telemetry</Text>
            </View>
            <View style={styles.headerAvatar}>
              <MaterialCommunityIcons name="shield-check" size={28} color="#1E2F97" />
            </View>
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.cardsContainer}>
            <Text style={styles.sectionTitle}>Overview & Live Telemetry</Text>

            <View style={styles.gridRow}>
              {/* Total Roster */}
              <View style={[styles.cardItem, styles.cardHalf]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Total Roster</Text>
                  <View style={[styles.iconBadge, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#1E40AF" />
                  </View>
                </View>
                <Text style={[styles.cardNumberLarge, { color: '#1E40AF' }]}>{totalCount}</Text>
                <Text style={styles.cardSubtitle}>Registered Students</Text>
              </View>

              {/* Online Active */}
              <View style={[styles.cardItem, styles.cardHalf]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Online Active</Text>
                  <View style={[styles.iconBadge, { backgroundColor: '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="wifi-check" size={20} color="#16A34A" />
                  </View>
                </View>
                <Text style={[styles.cardNumberLarge, { color: '#16A34A' }]}>{onlineCount}</Text>
                <Text style={styles.cardSubtitle}>Currently Connected</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              {/* Offline / Disconnected */}
              <View style={[styles.cardItem, styles.cardHalf]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Offline</Text>
                  <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="wifi-off" size={20} color="#DC2626" />
                  </View>
                </View>
                <Text style={[styles.cardNumberLarge, { color: '#DC2626' }]}>{offlineCount}</Text>
                <Text style={styles.cardSubtitle}>No Active Signal</Text>
              </View>

              {/* Refresh Info */}
              <View style={[styles.cardItem, styles.cardHalf]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Last Sync</Text>
                  <View style={[styles.iconBadge, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#4B5563" />
                  </View>
                </View>
                <Text style={styles.cardNumberMedium}>{lastUpdatedTime || 'N/A'}</Text>
                <Text style={styles.cardSubtitle}>{lastUpdatedDate || 'Auto-sync 10s'}</Text>
              </View>
            </View>

            {/* Health & Status Card */}
            <View style={styles.systemHealthCard}>
              <View style={styles.healthHeader}>
                <MaterialCommunityIcons name="server-network" size={22} color="#1E2F97" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.healthTitle}>Server & Telemetry Services</Text>
                  <Text style={styles.healthSub}>GPS polling, SOS alerts, & broadcast channel operational</Text>
                </View>
                <View style={styles.healthBadge}>
                  <Text style={styles.healthBadgeText}>NORMAL</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardAvoid: { flex: 1 },
  container: { paddingBottom: 40, paddingHorizontal: 16 },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerContent: { flex: 1, paddingRight: 12 },
  systemStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  systemStatusText: { fontSize: 11, fontWeight: '700', color: '#E0E7FF' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', marginTop: 2 },
  headerAvatar: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  cardsContainer: {
    paddingTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  cardHalf: {
    flex: 1,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  iconBadge: { padding: 8, borderRadius: 12 },
  cardNumberLarge: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  cardNumberMedium: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4, marginTop: 4 },
  cardSubtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  systemHealthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  healthHeader: { flexDirection: 'row', alignItems: 'center' },
  healthTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  healthSub: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  healthBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthBadgeText: { fontSize: 10, fontWeight: '800', color: '#16A34A' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#1E2F97', fontWeight: '600' },
});
