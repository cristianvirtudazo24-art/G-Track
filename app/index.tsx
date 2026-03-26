import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { mockLogin } from '../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSignIn = async () => {
    try {
      // Logic from services/auth.ts
      const response: any = await mockLogin(email, password, studentId);
      
      if (response.success) {
        console.log("✅ Login Success: Redirecting to Home...");
        // This jumps to app/home.tsx
        router.replace('/home'); 
      }
    } catch (error) {
      Alert.alert("Login Failed", "Please use the dev credentials provided.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>G!Track</Text>
        <Text style={styles.appSubtitle}>Student Safety & Tracking System</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        
        <Text style={styles.label}>Student Email</Text>
        <TextInput 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          placeholder="defgegf" 
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          placeholder="sjfdjbvhfv" 
        />

        <Text style={styles.label}>Student ID</Text>
        <TextInput 
          style={styles.input} 
          value={studentId} 
          onChangeText={setStudentId} 
          placeholder="kefnbjhf" 
        />

        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#2563EB', padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  appTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  appSubtitle: { color: '#fff', fontSize: 14, opacity: 0.8 },
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginBottom: 20 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});