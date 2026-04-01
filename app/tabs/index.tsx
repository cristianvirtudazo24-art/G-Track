import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../../hooks/useLocation';
import { mockLogin } from '../../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { startContinuousSharing } = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');

  const handleSignIn = async () => {
    // Basic validation
    if (!email || !password || (role === 'student' && !studentId)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      // 1. Verify with the Mock Logic
      const response: any = await mockLogin(email, password, role, role === 'student' ? studentId : undefined);

      if (response.success) {
        console.log("✅ Login Success!");

        // 2. Persist session so background services can identify the student
        await AsyncStorage.setItem('userRole', role);
        if (role === 'student') {
          await AsyncStorage.setItem('studentId', studentId);
          await AsyncStorage.setItem('studentEmail', email);
          // START THE CONTINUOUS SHARING ENGINE
          await startContinuousSharing(studentId);
        }

        // 3. Move to the correct interface
        if (role === 'admin') {
          router.replace('/tabs/(adminTabs)/dashboard');
        } else {
          router.replace('/tabs/home');
        }
      }
    } catch (error) {
      Alert.alert("Login Failed", "Invalid credentials for G!Track Test Mode.");
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

        <Text style={styles.label}>Email / Username</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter password"
        />

        {role === 'student' && (
          <>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Enter Student ID"
            />
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.devNote}>Dev Mode: Location sync starts after login</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1E2F97', padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'white', // In case the logo has transparency
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden', // Keeps the image within the circle
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  logoImage: { width: '100%', height: '100%' },
  appTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  appSubtitle: { color: '#fff', fontSize: 14, opacity: 0.9 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, elevation: 5 },
  roleSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  roleButtonActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  roleButtonTextActive: { color: '#1E2F97' },
  welcomeText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#F97316', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  devNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 15 }
});