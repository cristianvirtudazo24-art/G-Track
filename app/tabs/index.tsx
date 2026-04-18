import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../../hooks/useLocation';
import { login } from '../../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { startContinuousSharing } = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');

  const handleSignIn = async () => {
    const isStudent = role === 'student';
    const identifier = isStudent ? studentId : email;

    if (!identifier || !password) {
      Alert.alert("Error", `Please fill in your ${isStudent ? 'Student ID' : 'Email'} and Password`);
      return;
    }

    try {
      const response: any = await login(
        isStudent ? "" : email, 
        password, 
        role, 
        isStudent ? studentId : undefined
      );

      if (response.success) {
        console.log("✅ Login Success!");

        await AsyncStorage.setItem('userRole', role);
        if (isStudent && response.user) {
          const dbId = String(response.user.id);
          await AsyncStorage.setItem('userDbId', dbId);
          await AsyncStorage.setItem('studentId', studentId);
          await AsyncStorage.setItem('studentEmail', response.user.email || "");
          if (response.user.name) await AsyncStorage.setItem('studentName', response.user.name);
          if (response.user.gender) await AsyncStorage.setItem('studentGender', response.user.gender);

          await startContinuousSharing(dbId);
        }

        if (role === 'admin') {
          router.replace('/tabs/(adminTabs)/dashboard');
        } else {
          router.replace('/tabs/home');
        }
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appTitle}>G!Track</Text>
        <Text style={styles.appSubtitle}>Student Safety & Tracking System</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.roleSelector}>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'student' && styles.roleButtonActive]} 
            onPress={() => setRole('student')}
          >
            <Text style={[styles.roleButtonText, role === 'student' && styles.roleButtonTextActive]}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]} 
            onPress={() => setRole('admin')}
          >
            <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.welcomeText}>{role === 'student' ? 'Student Sign In' : 'Admin Sign In'}</Text>

        {role === 'admin' ? (
          <>
            <Text style={styles.label}>Email / Username</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              autoCapitalize="none"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Enter Student ID"
              autoCapitalize="characters"
            />
          </>
        )}

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter password"
        />

        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.devNote}>Dev Mode: Location sync starts after login</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1E2F97', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 25 },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  logoImage: { width: '80%', height: '80%' },
  appTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  appSubtitle: { color: '#fff', fontSize: 13, opacity: 0.85 },
  formCard: { backgroundColor: '#fff', borderRadius: 18, padding: 22, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10 },
  roleSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 3, marginBottom: 18 },
  roleButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  roleButtonActive: { backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  roleButtonText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  roleButtonTextActive: { color: '#1E2F97' },
  welcomeText: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15, color: '#111827' },
  button: { backgroundColor: '#F97316', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  devNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 15 }
});