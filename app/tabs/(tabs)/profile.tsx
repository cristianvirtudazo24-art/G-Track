import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../../../hooks/useLocation';
import { useUser } from '../../../hooks/useUser';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, loading, clearSession } = useUser();
  const { isSharing, stopContinuousSharing } = useLocation();

  const handleLogout = () => {
    const performLogout = async () => {
      await stopContinuousSharing();
      await clearSession();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) performLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={52} color="#1E2F97" />
        </View>
        <Text style={styles.name}>{session.name || 'G!Track User'}</Text>
        <View style={styles.idBadge}>
          <MaterialCommunityIcons name="identifier" size={14} color="#1E2F97" />
          <Text style={styles.idText}>{session.studentId || session.role?.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusChip, !isSharing && styles.statusChipInactive]}>
          <View style={[styles.statusDot, !isSharing && styles.statusDotInactive]} />
          <Text style={[styles.statusText, !isSharing && styles.statusTextInactive]}>
            {isSharing ? 'Tracking Active' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="email" size={18} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{session.email || 'No email set'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons 
                name={session.gender === 'female' ? 'gender-female' : 'gender-male'} 
                size={18} 
                color="#1E2F97" 
              />
            </View>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{session.gender || 'Not specified'}</Text>
          </View>
        </View>

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
    paddingTop: 50,
    paddingBottom: 26,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  name: { fontSize: 21, fontWeight: '800', color: '#fff', marginBottom: 6 },
  idBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4, marginBottom: 8 },
  idText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  statusChipInactive: { backgroundColor: '#F3F4F6' },
  statusDotInactive: { backgroundColor: '#9CA3AF' },
  statusTextInactive: { color: '#6B7280' },
  body: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  infoIconWrap: { backgroundColor: '#EEF2FF', padding: 7, borderRadius: 8, marginRight: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FEE2E2',
    elevation: 1,
  },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 15 },
});