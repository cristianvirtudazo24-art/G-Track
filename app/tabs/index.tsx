import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { login } from '../../services/auth';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { startContinuousSharing } = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);

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
                keyboardType="email-address"
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
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter password"
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
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.devNote}>Dev Mode: Location sync starts after login</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scrollContainer: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoWrapper: {
    width: Math.min(width * 0.3, 100), // Responsive logo size
    height: Math.min(width * 0.3, 100),
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.xl,
  },
  logoImage: { width: '70%', height: '70%' },
  appTitle: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  appSubtitle: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    opacity: 0.9,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.sm,
    ...Shadows.lg,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.slate[100],
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  roleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  roleButtonActive: {
    backgroundColor: Colors.background.primary,
    ...Shadows.sm,
  },
  roleButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[500],
  },
  roleButtonTextActive: {
    color: Colors.primary,
  },
  welcomeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  eyeIcon: {
    padding: Spacing.md,
  },
  button: {
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
  devNote: {
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xl,
    fontStyle: 'italic',
  },
});