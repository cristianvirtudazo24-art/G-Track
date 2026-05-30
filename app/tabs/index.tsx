import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { login } from '../../services/auth';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { startContinuousSharing } = useLocation();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    const isStudent = role === 'student';
    const identifier = isStudent ? studentId : adminId;

    if (!identifier || !password) {
      Alert.alert("Error", `Please fill in your ${isStudent ? 'Student ID' : 'Staff ID'} and Password`);
      return;
    }

    try {
      const response: any = await login(
        isStudent ? "" : adminId, 
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
          await AsyncStorage.setItem('studentProfile', JSON.stringify(response.user));
          if (response.user.email) await AsyncStorage.setItem('studentEmail', response.user.email);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>G!track</Text>
          <Text style={styles.appSubtitle}>Authentication Portal</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{role === 'admin' ? 'Admin Authentication Portal' : 'Student Authentication Portal'}</Text>
          <Text style={styles.formSubtitle}>Enter your credentials to access your account.</Text>

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

          {role === 'admin' ? (
            <>
              <Text style={styles.label}>Staff ID</Text>
              <TextInput
                style={styles.input}
                value={adminId}
                onChangeText={setAdminId}
                placeholder="Enter your Staff ID"
                placeholderTextColor="#9CA3AF"
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
                placeholder="Enter your Student ID"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF4FF' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  logoWrapper: {
    width: Math.min(width * 0.28, 110),
    height: Math.min(width * 0.28, 110),
    borderRadius: 28,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    ...Shadows.xl,
  },
  logoImage: { width: '72%', height: '72%' },
  appTitle: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  appSubtitle: {
    color: Colors.slate[600],
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 28,
    marginHorizontal: 8,
    ...Shadows.lg,
  },
  formTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    padding: 4,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 999,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  roleButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[600],
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[600],
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    backgroundColor: '#F9FAFB',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  eyeIcon: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 18,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  devNote: {
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xl,
    fontStyle: 'italic',
  },
});