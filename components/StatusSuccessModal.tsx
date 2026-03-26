import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  isVisible: boolean;
  type: 'emergency' | 'safe' | 'help' | null;
  onClose: () => void;
}

export const StatusSuccessModal = ({ isVisible, type, onClose }: Props) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {type === 'emergency' ? '🚨 EMERGENCY SENT' : '✅ STATUS UPDATED'}
          </Text>
          <Text style={styles.subText}>The administrator has been notified.</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  subText: { color: '#666', marginBottom: 20 },
  btn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});