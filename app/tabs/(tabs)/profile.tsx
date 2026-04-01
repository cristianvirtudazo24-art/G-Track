import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../../../hooks/useLocation';

export default function ProfileScreen() {
  const router = useRouter();
  const { stopContinuousSharing } = useLocation();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        stopContinuousSharing().then(() => router.replace('/'));
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await stopContinuousSharing();
            router.replace('/');
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={52} color="#1E2F97" />
        </View>
        <Text style={styles.name}>John Doe</Text>
        <View style={styles.idBadge}>
          <MaterialCommunityIcons name="identifier" size={14} color="#1E2F97" />
          <Text style={styles.idText}>PN2026-0123</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Tracking Active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="school" size={18} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>Class 2026</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="gender-male" size={18} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>Male</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  header: {
    backgroundColor: '#1E2F97',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  idBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 5, marginBottom: 10 },
  idText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#059669' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  body: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  infoIconWrap: { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 10, marginRight: 12 },
  infoLabel: { flex: 1, fontSize: 15, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#111827', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    elevation: 2,
  },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 16 },
});