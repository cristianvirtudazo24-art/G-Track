import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // FIXED: Using relative path to go back to the Login screen
    router.replace('../index' as any); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 40 }}>🧑‍STUDENT</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.idBadge}>ID: PN2026-0123</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <View style={styles.infoRow}><Text style={styles.label}>Class</Text><Text style={styles.value}>Class 2026</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Gender</Text><Text style={styles.value}>Male</Text></View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  profileHeader: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold' },
  idBadge: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  infoSection: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  label: { color: '#6B7280' },
  value: { color: '#111827', fontWeight: '500' },
  logoutButton: { margin: 20, backgroundColor: '#FEE2E2', padding: 18, borderRadius: 15, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: 'bold' }
});