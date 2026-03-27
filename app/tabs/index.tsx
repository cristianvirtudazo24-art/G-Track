import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../../hooks/useLocation'; // Corrected path to hooks
import { mockLogin } from '../../services/auth'; // Corrected path to services

export default function LoginScreen() {
  const router = useRouter();
  const { startContinuousSharing } = useLocation(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSignIn = async () => {
    // Basic validation
    if (!email || !password || !studentId) {
      Alert.alert("Error", "Please fill in all fields (defgegf / sjfdjbvhfv / kefnbjhf)");
      return;
    }

    try {
      // 1. Verify with the Mock Logic
      const response: any = await mockLogin(email, password, studentId);
      
      if (response.success) {
        console.log("✅ Login Success!");

        // 2. START THE CONTINUOUS SHARING ENGINE
        // This triggers the Background Task to fulfill "Location Sharing to All" [cite: 21, 22]
        await startContinuousSharing(); 
        
        // 3. Move to the Dashboard within the Tab bar interface
        // This ensures the bottom Home, Alerts, and Profile buttons are visible
        router.replace('/tabs/home'); 
      }
    } catch (error) {
      Alert.alert("Login Failed", "Invalid credentials for G!Track Test Mode.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
           <Text style={{fontSize: 40}}>🛡️</Text>
        </View>
        <Text style={styles.appTitle}>G!Track</Text>
        <Text style={styles.appSubtitle}>Student Safety & Tracking System</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.welcomeText}>Student Sign In</Text>
        
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

        <Text style={styles.label}>Student ID</Text>
        <TextInput 
          style={styles.input} 
          value={studentId} 
          onChangeText={setStudentId} 
          placeholder="Enter Student ID" 
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
  container: { flexGrow: 1, backgroundColor: '#2563EB', padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  appTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  appSubtitle: { color: '#fff', fontSize: 14, opacity: 0.9 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, elevation: 5 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#2563EB', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  devNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 15 }
});