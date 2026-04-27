import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelectAction: (type: 'help' | 'blackout') => void;
}

export const SOSModal = ({ isVisible, onClose, onSelectAction }: Props) => {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>SOS Alert</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Select an emergency action to alert administrators</Text>

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="alert-octagon" size={36} color="#E8313A" />
          </View>

          {/* Merged: Emergency SOS + I need Help → "I need Help" */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#E8313A' }]}
            onPress={() => onSelectAction('help')}
            activeOpacity={0.85}
          >
            <View style={styles.btnIconWrap}>
              <MaterialCommunityIcons name="alert" size={22} color="white" />
            </View>
            <View style={styles.btnTextWrap}>
              <Text style={styles.btnLabel}>I need Help</Text>
              <Text style={styles.btnSub}>Triggers video + alert</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Blackout Alert */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F97316' }]}
            onPress={() => onSelectAction('blackout')}
            activeOpacity={0.85}
          >
            <View style={styles.btnIconWrap}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color="white" />
            </View>
            <View style={styles.btnTextWrap}>
              <Text style={styles.btnLabel}>Blackout Alert</Text>
              <Text style={styles.btnSub}>Notify admin of power loss</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: '#F5F7FF',
    borderRadius: 28,
    padding: 24,
    width: '92%',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 },
  closeBtn: { padding: 4, backgroundColor: '#E5E7EB', borderRadius: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, alignSelf: 'flex-start' },
  iconCircle: { backgroundColor: '#FEE2E2', padding: 18, borderRadius: 50, marginBottom: 20 },
  actionBtn: {
    flexDirection: 'row',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  btnIconWrap: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, marginRight: 14 },
  btnTextWrap: { flex: 1 },
  btnLabel: { color: 'white', fontWeight: '700', fontSize: 16 },
  btnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});