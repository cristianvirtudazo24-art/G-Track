import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

export const BlackoutModal = ({ isVisible, onClose, onSubmit }: Props) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    onSubmit(message);
    setMessage('');
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Blackout Alert</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="lightning-bolt" size={32} color="#F97316" />
          </View>

          <Text style={styles.instruction}>
            Notify your administrators of a power outage. Your current battery level will be sent automatically.
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Optional: How long has it been? (e.g. 30 mins)"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={150}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <MaterialCommunityIcons name="send" size={18} color="white" />
            <Text style={styles.submitText}>Send Alert</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  closeBtn: { padding: 4, backgroundColor: '#E5E7EB', borderRadius: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  iconCircle: { backgroundColor: '#FFF7ED', padding: 18, borderRadius: 50, marginBottom: 16 },
  instruction: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 21 },
  textInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#F97316',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
