import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ActivityIndicator, Dimensions, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { login } from '../../services/auth';
import { TermsModal } from '../../components/TermsModal';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { startContinuousSharing } = useLocation();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier: boolean; password: boolean }>({
    identifier: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = () => {
    setErrorMessage(null);
    setFieldErrors({ identifier: false, password: false });
  };

  const handleRoleChange = (newRole: 'student' | 'admin') => {
    setRole(newRole);
    clearErrors();
  };

  const handleSignIn = async () => {
    clearErrors();
    const isStudent = role === 'student';
    const identifier = isStudent ? studentId : adminId;

    const hasIdError = !identifier.trim();
    const hasPassError = !password.trim();

    if (hasIdError || hasPassError) {
      setFieldErrors({
        identifier: hasIdError,
        password: hasPassError,
      });
      setErrorMessage(`Please enter your ${isStudent ? 'Student ID' : 'Staff ID'} and Password.`);
      return;
    }

    setIsSubmitting(true);
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
      } else {
        setFieldErrors({ identifier: true, password: true });
        setErrorMessage(response.message || "Invalid credentials. Please check your ID and Password.");
      }
    } catch (error: any) {
      setFieldErrors({ identifier: true, password: true });
      setErrorMessage(error.message || "Invalid credentials. Please check your ID and Password.");
    } finally {
      setIsSubmitting(false);
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
                onPress={() => handleRoleChange('student')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleButtonText, role === 'student' && styles.roleButtonTextActive]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]} 
                onPress={() => handleRoleChange('admin')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner Notice */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" style={styles.errorBannerIcon} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Input fields */}
            {role === 'admin' ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, fieldErrors.identifier && styles.labelError]}>Staff ID</Text>
                <View style={[styles.inputContainer, fieldErrors.identifier && styles.inputContainerError]}>
                  <MaterialCommunityIcons 
                    name="shield-account-outline" 
                    size={20} 
                    color={fieldErrors.identifier ? '#EF4444' : '#9CA3AF'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={adminId}
                    onChangeText={(val) => {
                      setAdminId(val);
                      if (errorMessage || fieldErrors.identifier) clearErrors();
                    }}
                    placeholder="Enter your Staff ID"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />
                </View>
                {fieldErrors.identifier && (
                  <Text style={styles.fieldErrorText}>
                    {adminId.trim() ? 'Invalid Staff ID' : 'Staff ID is required'}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, fieldErrors.identifier && styles.labelError]}>Student ID</Text>
                <View style={[styles.inputContainer, fieldErrors.identifier && styles.inputContainerError]}>
                  <MaterialCommunityIcons 
                    name="card-account-details-outline" 
                    size={20} 
                    color={fieldErrors.identifier ? '#EF4444' : '#9CA3AF'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={studentId}
                    onChangeText={(val) => {
                      setStudentId(val);
                      if (errorMessage || fieldErrors.identifier) clearErrors();
                    }}
                    placeholder="Enter your Student ID"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                  />
                </View>
                {fieldErrors.identifier && (
                  <Text style={styles.fieldErrorText}>
                    {studentId.trim() ? 'Invalid Student ID' : 'Student ID is required'}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, fieldErrors.password && styles.labelError]}>Password</Text>
              <View style={[styles.inputContainer, fieldErrors.password && styles.inputContainerError]}>
                <MaterialCommunityIcons 
                  name="lock-outline" 
                  size={20} 
                  color={fieldErrors.password ? '#EF4444' : '#9CA3AF'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage || fieldErrors.password) clearErrors();
                  }}
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
                    color={fieldErrors.password ? '#EF4444' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text style={styles.fieldErrorText}>
                  {password.trim() ? 'Invalid Password' : 'Password is required'}
                </Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.button, isSubmitting && styles.buttonDisabled]} 
              onPress={handleSignIn} 
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotButton} 
              onPress={() => setShowForgotPassword(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Terms & Conditions Notice */}
            <TouchableOpacity 
              style={styles.termsNoticeButton} 
              onPress={() => setShowTerms(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.termsNoticeText}>
                By logging in, you agree to our{' '}
                <Text style={styles.termsLinkText}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
      />

      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
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
    width: '100%',
    height: '100%',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorBannerIcon: {
    marginRight: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    lineHeight: 18,
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
  labelError: {
    color: '#DC2626',
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
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: '#1E2F97',
    fontSize: 14,
    fontWeight: '700',
  },
  termsNoticeButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
  },
  termsNoticeText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLinkText: {
    color: '#1E2F97',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});