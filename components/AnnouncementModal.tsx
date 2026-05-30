import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnnouncementModalProps {
  visible: boolean;
  title: string;
  subject?: string;
  message: string;
  onClose: () => void;
  onAcknowledge?: () => void;
}

const { width } = Dimensions.get('window');

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ 
  visible,
  title,
  subject,
  message,
  onClose,
  onAcknowledge,
}) => {
  const handleAcknowledge = () => {
    if (onAcknowledge) onAcknowledge();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title || 'Broadcast Announcement'}</Text>
              {subject ? <Text style={styles.subject}>{subject}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
              <Ionicons name="close" size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.messageContainer}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.message}>{message}</Text>
          </ScrollView>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAcknowledge}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Acknowledge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#0A1128',
    borderRadius: 20,
    width: width * 0.88,
    maxHeight: '85%',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 153, 51, 0.3)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subject: {
    fontSize: 16,
    color: '#F3F4F6',
    lineHeight: 22,
  },
  closeButton: {
    padding: 6,
    borderRadius: 18,
  },
  messageContainer: {
    flex: 1,
    marginBottom: 24,
    maxHeight: 320,
  },
  messageContent: {
    paddingRight: 4,
  },
  message: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FF9933',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
