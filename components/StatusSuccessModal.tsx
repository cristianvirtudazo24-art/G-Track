import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  isVisible: boolean;
  type: 'help' | 'safe' | 'blackout' | null;
  onClose: () => void;
}

const INFO: Record<string, { icon: string; color: string; bg: string; label: string; sub: string }> = {
  help:     { icon: 'alert-octagon', color: '#E8313A', bg: '#FEE2E2', label: 'Alert Sent!',        sub: 'Admin has been alerted. Help is on the way.' },
  safe:     { icon: 'shield-check', color: '#059669', bg: '#D1FAE5', label: 'Status Updated!',    sub: 'You marked yourself as safe.' },
  blackout: { icon: 'lightning-bolt', color: '#F97316', bg: '#FFF7ED', label: 'Blackout Reported!', sub: 'Admin has been notified of power loss.' },
};

export const StatusSuccessModal = ({ isVisible, type, onClose }: Props) => {
  const info = type ? INFO[type] : null;
  if (!info) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: info.bg }]}>
            <MaterialCommunityIcons name={info.icon as any} size={40} color={info.color} />
          </View>
          <Text style={styles.title}>{info.label}</Text>
          <Text style={styles.sub}>{info.sub}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: info.color }]} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.btnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '85%',
    backgroundColor: '#F5F7FF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  iconCircle: { padding: 20, borderRadius: 50, marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sub: { color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  btn: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 3 },
  btnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});