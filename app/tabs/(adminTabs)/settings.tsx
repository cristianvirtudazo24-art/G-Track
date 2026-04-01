import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';

export default function AdminSettings() {
  const router = useRouter();

  const handleSignOut = () => {
    router.replace('/tabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Admin preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemIconWrap}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#1E2F97" />
            </View>
            <Text style={styles.itemText}>Profile Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemIconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={20} color="#1E2F97" />
            </View>
            <Text style={styles.itemText}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App</Text>
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemIconWrap}>
              <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#1E2F97" />
            </View>
            <Text style={styles.itemText}>Privacy & Security</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemIconWrap}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#1E2F97" />
            </View>
            <Text style={styles.itemText}>About G!Track</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
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
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemIconWrap: { backgroundColor: '#EEF2FF', padding: 9, borderRadius: 12, marginRight: 14 },
  itemText: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  signOutButton: {
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
  signOutText: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
});
