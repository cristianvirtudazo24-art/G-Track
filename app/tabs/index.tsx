import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

        // Store admin dbId for message alignment tracking
        if (role === 'admin' && response.user) {
          const adminDbId = String(response.user.id || response.user.staff_id || adminId);
          console.log('👨‍💼 Storing admin dbId:', adminDbId);
          await AsyncStorage.setItem('userDbId', adminDbId);
          if (response.user.email) await AsyncStorage.setItem('studentEmail', response.user.email);
          if (response.user.name) await AsyncStorage.setItem('studentName', response.user.name);
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
    <ImageBackground
      source={require('../../assets/images/login_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>Enter your credentials to access your account</Text>

            {/* Role Tab Selector */}
            <View style={styles.roleSelector}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'student' && styles.roleButtonActive]} 
                onPress={() => setRole('student')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleButtonText, role === 'student' && styles.roleButtonTextActive]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]} 
                onPress={() => setRole('admin')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Input fields */}
            {role === 'admin' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Staff ID</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="shield-account-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={adminId}
                    onChangeText={setAdminId}
                    placeholder="Enter your Staff ID"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student ID</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={studentId}
                    onChangeText={setStudentId}
                    placeholder="Enter your Student ID"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.button} onPress={handleSignIn} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(234, 244, 255, 0.85)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    width: Math.min(width * 0.28, 110),
    height: Math.min(width * 0.28, 110),
    borderRadius: 28,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  logoImage: {
    width: '75%',
    height: '75%',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E2F97',
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5EDF9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    height: 50,
  },
  roleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  roleButtonActive: {
    backgroundColor: '#1E2F97',
    ...Shadows.sm,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E2F97',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  eyeIcon: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#1E2F97',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotText: {
    color: '#1E2F97',
    fontSize: 14,
    fontWeight: '700',
  },
});