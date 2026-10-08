import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Shadows } from '../constants/theme';
import { resetPasswordDirect } from '../services/auth';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetState = () => {
    setRole('student');
    setIdentifier('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setIsSuccess(false);
    setLoading(false);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg(`Please enter your ${role === 'student' ? 'Student ID' : 'Staff ID'}.`);
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordDirect(identifier.trim(), newPassword, role);
      if (response.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(response.message || 'Failed to reset password. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resetting password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconBadge, isSuccess && styles.iconBadgeSuccess]}>
                <MaterialCommunityIcons
                  name={isSuccess ? "check-circle-outline" : "lock-reset"}
                  size={24}
                  color={isSuccess ? "#10B981" : "#1E2F97"}
                />
              </View>
              <View>
                <Text style={styles.title}>
                  {isSuccess ? 'Reset Complete!' : 'Reset Password'}
                </Text>
                <Text style={styles.subtitle}>
                  {isSuccess
                    ? 'Your password has been updated'
                    : 'Enter your ID and new password'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {!isSuccess ? (
              <>
                {/* Role selector */}
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
                    onPress={() => { setRole('student'); setErrorMsg(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]}
                    onPress={() => { setRole('admin'); setErrorMsg(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
                  </TouchableOpacity>
                </View>

                {/* ID Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{role === 'student' ? 'Student ID' : 'Staff ID'}</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons
                      name={role === 'student' ? 'card-account-details-outline' : 'shield-account-outline'}
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={identifier}
                      onChangeText={(val) => { setIdentifier(val); setErrorMsg(null); }}
                      placeholder={role === 'student' ? 'Enter your Student ID' : 'Enter your Staff ID'}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize={role === 'student' ? 'characters' : 'none'}
                    />
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={(val) => { setNewPassword(val); setErrorMsg(null); }}
                      secureTextEntry={!showPassword}
                      placeholder="Enter new password (min. 6 chars)"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={(val) => { setConfirmPassword(val); setErrorMsg(null); }}
                      secureTextEntry={!showPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[styles.actionButton, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* Success State */
              <View style={styles.successContainer}>
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check-bold" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Password Updated Successfully!</Text>
                <Text style={styles.successMessage}>
                  Your password for {role === 'student' ? 'Student ID' : 'Staff ID'} ({identifier}) has been reset. You can now log in with your new password.
                </Text>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E2F97',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5EDF9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    height: 46,
  },
  roleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  roleButtonActive: {
    backgroundColor: '#1E2F97',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
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
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
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
  actionButton: {
    backgroundColor: '#1E2F97',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
    ...Shadows.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
});
