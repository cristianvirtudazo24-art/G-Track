import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SafeConfirmModal = ({ isVisible, onClose, onConfirm }: Props) => {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Confirm Safety Status</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check" size={44} color="#059669" />
          </View>

          <Text style={styles.heading}>Are you sure you are safe?</Text>
          <Text style={styles.message}>
            This will update your status to <Text style={styles.boldGreen}>Safe</Text> on the Admin Monitoring Dashboard and resolve any active emergency alerts for your account.
          </Text>

          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {/* Confirm Safe Button */}
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => {
                onClose();
                onConfirm();
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>Yes, I&apos;m Safe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5F7FF',
    borderRadius: 28,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
  },
  iconCircle: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 50,
    marginBottom: 14,
    marginTop: 6,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  boldGreen: {
    fontWeight: '800',
    color: '#059669',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: '#059669',
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
