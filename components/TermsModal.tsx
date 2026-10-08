import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/theme';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

const { width, height } = Dimensions.get('window');

export const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onClose,
  onAccept,
  showAcceptButton = false,
}) => {
  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.iconBadge}>
                  <MaterialCommunityIcons name="file-document-outline" size={22} color="#1E2F97" />
                </View>
                <View>
                  <Text style={styles.title}>Terms & Conditions</Text>
                  <Text style={styles.subtitle}>G!Track Safety & Tracking Services</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.lastUpdated}>Last Updated: October 2026</Text>

              {/* Section 1 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color="#1E2F97" />
                  <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                </View>
                <Text style={styles.paragraph}>
                  By accessing or using the G!Track mobile application, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all terms, you may not access or use the application services.
                </Text>
              </View>

              {/* Section 2 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1E2F97" />
                  <Text style={styles.sectionTitle}>2. Location & GPS Tracking</Text>
                </View>
                <Text style={styles.paragraph}>
                  G!Track provides continuous location monitoring to support campus safety and emergency response coordination.
                </Text>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Background Location:</Text> The app collects real-time location data when enabled to assist authorized campus response personnel during active sessions or emergency signals.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Accuracy:</Text> GPS signal precision depends on device hardware, cellular networks, and environmental factors.
                  </Text>
                </View>
              </View>

              {/* Section 3 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="alert-octagon-outline" size={20} color="#E8313A" />
                  <Text style={styles.sectionTitle}>3. Emergency SOS & Blackout Features</Text>
                </View>
                <Text style={styles.paragraph}>
                  The SOS Alert and Blackout tools are intended strictly for genuine safety emergencies or critical assistance requests.
                </Text>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>
                    Intentional misuse, false alarms, or fraudulent emergency triggers may lead to account suspension and disciplinary review.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>
                    Audio/video recordings during active SOS alerts are transmitted to authorized administrators for safety verification.
                  </Text>
                </View>
              </View>

              {/* Section 4 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#1E2F97" />
                  <Text style={styles.sectionTitle}>4. User Privacy & Data Protection</Text>
                </View>
                <Text style={styles.paragraph}>
                  Your privacy is paramount. Personal data including location history, profile details, and emergency logs are encrypted in transit and at rest.
                </Text>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>
                    Data is strictly restricted to designated campus authorities and system administrators.
                  </Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>
                    Location data is never sold, rented, or shared with unauthorized third parties.
                  </Text>
                </View>
              </View>

              {/* Section 5 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="account-key-outline" size={20} color="#1E2F97" />
                  <Text style={styles.sectionTitle}>5. User Account Responsibilities</Text>
                </View>
                <Text style={styles.paragraph}>
                  You are responsible for maintaining the confidentiality of your credentials (Student ID / Staff ID and password). You agree to notify administrators immediately of any unauthorized access to your account.
                </Text>
              </View>

              {/* Section 6 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="update" size={20} color="#1E2F97" />
                  <Text style={styles.sectionTitle}>6. Updates to Terms</Text>
                </View>
                <Text style={styles.paragraph}>
                  G!Track reserves the right to modify these Terms at any time. Continued use of the platform constitutes your consent to updated terms.
                </Text>
              </View>
            </ScrollView>

            {/* Footer / Buttons */}
            <View style={styles.footer}>
              {showAcceptButton ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={handleAccept}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.acceptButtonText}>I Agree</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.closeFullButton]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptButtonText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  safeContainer: {
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  container: {
    maxHeight: height * 0.88,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
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
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  bulletItem: {
    flexDirection: 'row',
    marginTop: 6,
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#1E2F97',
    marginRight: 8,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declineButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#1E2F97',
    ...Shadows.sm,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeFullButton: {
    width: '100%',
    backgroundColor: '#1E2F97',
    ...Shadows.sm,
  },
});
