// components/SOSModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelectAction: (type: 'emergency' | 'safe' | 'help') => void;
}

export const SOSModal = ({ isVisible, onClose, onSelectAction }: Props) => {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#636E72" />
          </TouchableOpacity>

          <Text style={styles.title}>SOS & Safety</Text>
          <Text style={styles.subtitle}>Emergency alert or safety status check-in</Text>

          <View style={styles.iconCircle}>
             <MaterialCommunityIcons name="alert-octagon" size={40} color="#FF4757" />
          </View>

          <Text style={styles.question}>How can we help you?</Text>
          <Text style={styles.instruction}>Choose an option below to alert administrators</Text>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#FF0000' }]} 
            onPress={() => onSelectAction('emergency')}>
            <MaterialCommunityIcons name="alert" size={24} color="white" />
            <Text style={styles.btnText}>EMERGENCY SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#00B894' }]} 
            onPress={() => onSelectAction('safe')}>
            <MaterialCommunityIcons name="shield-check" size={24} color="white" />
            <Text style={styles.btnText}>I am Safe</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#FF7675' }]} 
            onPress={() => onSelectAction('help')}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="white" />
            <Text style={styles.btnText}>I need Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25, width: '90%', alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2D3436' },
  subtitle: { fontSize: 14, color: '#636E72', marginBottom: 20 },
  iconCircle: { backgroundColor: '#FFEAA7', padding: 20, borderRadius: 50, marginBottom: 15 },
  question: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  instruction: { fontSize: 14, color: '#636E72', textAlign: 'center', marginBottom: 20 },
  actionBtn: { flexDirection: 'row', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});