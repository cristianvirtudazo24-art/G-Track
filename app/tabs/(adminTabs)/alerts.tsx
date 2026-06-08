import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from '../../../hooks/useUser';
import { getAlerts, getChatMessages, getStudents, sendChatMessage } from '../../../services/api';
import { ChatMessage } from '../../../types/index';

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  danger:  { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon', label: 'DANGER' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert',         label: 'WARNING' },
  info:    { color: '#1E2F97', bg: '#EEF2FF', icon: 'information',    label: 'INFO' },
};

type ViewMode = 'student_messages' | 'emergency_alert' | 'broadcast_notifications' | null;

export default function AdminAlertsScreen() {
  const { session } = useUser();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('student_messages');
  const [selectedClass, setSelectedClass] = useState('All');
  const [showMenu, setShowMenu] = useState(false);
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchAlerts = () => {
      getAlerts().then(setAlerts);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewMode === 'student_messages') {
      setLoading(true);
      getStudents().then((data) => {
        setStudents(data || []);
        setLoading(false);
      });
    }
  }, [viewMode]);

  // Load chat messages when student is selected
  useEffect(() => {
    if (selectedStudent) {
      loadChatMessages(true);
      // Set up polling for new messages every 3 seconds
      const interval = setInterval(() => {
        loadChatMessages(false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedStudent]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  const loadChatMessages = async (showLoader = true) => {
    if (!selectedStudent) return;
    try {
      if (showLoader) setChatLoading(true);
      const messages = await getChatMessages(selectedStudent.id);
      setChatMessages(messages || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      if (showLoader) setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent) return;

    const messageText = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      const result = await sendChatMessage(selectedStudent.id, messageText, session?.dbId || undefined);

      if (result) {
        // Add message to local state immediately for optimistic update
        setChatMessages(prev => [...prev, result]);

        // Reload messages to ensure sync with backend
        setTimeout(() => {
          loadChatMessages(false);
        }, 500);
      } else {
        // Show error message
        setNewMessage(messageText); // Restore message on error
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setChatMessages([]);
  };

  const handleBackFromChat = () => {
    setSelectedStudent(null);
    setChatMessages([]);
    setNewMessage('');
  };

  const filteredStudents = selectedClass === 'All'
    ? students
    : students.filter(student => String(student.class) === String(selectedClass));

  const handleMenuItemPress = (mode: ViewMode) => {
    if (mode === 'student_messages' || mode === 'emergency_alert' || mode === 'broadcast_notifications') {
      setViewMode(mode);
      setShowMenu(false);
    }
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setShowClassMenu(false);
  };

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'student_messages':
        return 'Student Messages';
      case 'emergency_alert':
        return 'Emergency Alerts';
      case 'broadcast_notifications':
        return 'Broadcast Notifications';
      default:
        return null;
    }
  };

  const renderStudentMessages = () => (
    <View style={styles.contentContainer}>
      <View style={styles.classFilterSection}>
        <TouchableOpacity
          style={styles.classFilterButton}
          onPress={() => setShowClassMenu(!showClassMenu)}
        >
          <Text style={styles.classFilterText}>Class: {selectedClass}</Text>
          <MaterialCommunityIcons name={showClassMenu ? 'chevron-up' : 'chevron-down'} size={20} color="#1E2F97" />
        </TouchableOpacity>

        {showClassMenu && (
          <View style={styles.classDropdown}>
            {['All', '2026', '2027', '2028'].map((className) => (
              <TouchableOpacity
                key={className}
                style={[styles.classDropdownItem, selectedClass === className && styles.classDropdownItemActive]}
                onPress={() => handleClassSelect(className)}
              >
                <Text style={[styles.classDropdownText, selectedClass === className && styles.classDropdownTextActive]}>
                  {className === 'All' ? 'All Classes' : `Class ${className}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E2F97" />
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>No students found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.studentCard}
              onPress={() => handleStudentSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.studentAvatar}>
                <MaterialCommunityIcons name="account-circle" size={32} color="#1E2F97" />
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name || 'Unknown'}</Text>
                <Text style={styles.studentDetails}>ID: {item.student_id} • Class: {item.class}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderChatScreen = () => {
    if (!selectedStudent) return null;

    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
      const isAdminMessage = item.sender === 'admin';
      const messageTime = new Date(item.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return (
        <View
          style={[
            styles.messageContainer,
            isAdminMessage ? styles.adminMessageContainer : styles.studentMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isAdminMessage ? styles.adminMessageBubble : styles.studentMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isAdminMessage ? styles.adminMessageText : styles.studentMessageText,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isAdminMessage ? styles.adminMessageTime : styles.studentMessageTime,
              ]}
            >
              {messageTime}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.chatScreenContainer}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackFromChat}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>{selectedStudent.name || 'Student'}</Text>
          <View style={styles.chatHeaderPlaceholder} />
        </View>

        {/* Messages */}
        {chatLoading && chatMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E2F97" />
          </View>
        ) : chatMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chat-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubText}>Start a conversation with {selectedStudent.name}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        )}

        {/* Message Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline={true}
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

  const renderContent = () => {
    // If a student is selected, show chat screen
    if (selectedStudent && viewMode === 'student_messages') {
      return renderChatScreen();
    }

    switch (viewMode) {
      case 'student_messages':
        return renderStudentMessages();
      case 'emergency_alert':
        return (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No alerts actively recorded.</Text>}
            renderItem={({ item }) => {
              const cfg = ALERT_CONFIG[item.type] ?? ALERT_CONFIG.info;
              return (
                <View style={styles.alertCard}>
                  <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertType, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={styles.alertTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={styles.alertBody}>{item.text}</Text>
                    <Text style={styles.alertStudentId}>Student ID: {item.studentId}</Text>
                  </View>
                </View>
              );
            }}
          />
        );
      case 'broadcast_notifications':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.emptyText}>Broadcast Notifications section - Coming soon</Text>
          </View>
        );
      default:
        return (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No alerts actively recorded.</Text>}
            renderItem={({ item }) => {
              const cfg = ALERT_CONFIG[item.type] ?? ALERT_CONFIG.info;
              return (
                <View style={styles.alertCard}>
                  <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertType, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={styles.alertTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={styles.alertBody}>{item.text}</Text>
                    <Text style={styles.alertStudentId}>Student ID: {item.studentId}</Text>
                  </View>
                </View>
              );
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Show chat screen if student is selected */}
      {selectedStudent && viewMode === 'student_messages' ? (
        renderChatScreen()
      ) : (
        <>
          {/* Show normal UI if not in chat mode */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>Send and manage notifications</Text>
            </View>
          </View>

          <View style={styles.topBar}>
            {viewMode && (
              <Text style={styles.selectedLabel}>{getViewModeLabel()}</Text>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {showMenu && (
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('student_messages')}
              >
                <MaterialCommunityIcons name="message-text" size={20} color="#1E2F97" />
                <Text style={styles.menuItemText}>Student Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('emergency_alert')}
              >
                <MaterialCommunityIcons name="alert-circle" size={20} color="#E8313A" />
                <Text style={styles.menuItemText}>Emergency Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('broadcast_notifications')}
              >
                <MaterialCommunityIcons name="broadcast" size={20} color="#F97316" />
                <Text style={styles.menuItemText}>Broadcast Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowClassMenu(!showClassMenu)}
              >
                <MaterialCommunityIcons name="filter" size={20} color="#1E2F97" />
                <Text style={styles.menuItemText}>Filter By Class</Text>
                <MaterialCommunityIcons name={showClassMenu ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {showClassMenu && (
                <View style={styles.classMenuContainer}>
                  {['All', '2026', '2027', '2028'].map((className) => (
                    <TouchableOpacity
                      key={className}
                      style={[styles.classMenuItem, selectedClass === className && styles.classMenuItemActive]}
                      onPress={() => handleClassSelect(className)}
                    >
                      <Text style={[styles.classMenuItemText, selectedClass === className && styles.classMenuItemTextActive]}>
                        {className === 'All' ? 'All Classes' : `Class ${className}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {renderContent()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FF' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2F97',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E2F97',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    flex: 1,
  },
  classMenuContainer: {
    backgroundColor: '#F9FAFB',
    paddingLeft: 60,
  },
  classMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
    marginRight: 12,
  },
  classMenuItemActive: {
    backgroundColor: '#1E2F97',
  },
  classMenuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  classMenuItemTextActive: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  classFilterSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  classFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2F97',
  },
  classDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  classDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  classDropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  classDropdownText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  classDropdownTextActive: {
    color: '#1E2F97',
    fontWeight: '700',
  },
  list: { padding: 20, paddingBottom: 40 },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  iconWrap: { padding: 10, borderRadius: 14, marginRight: 14, marginTop: 2 },
  alertContent: { flex: 1 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  alertType: { fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  alertTime: { fontSize: 12, color: '#9CA3AF' },
  alertBody: { fontSize: 14, color: '#4B5563', lineHeight: 21, marginTop: 2 },
  alertStudentId: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentAvatar: {
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 10 },
  
  // Chat styles
  chatScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  chatHeader: {
    backgroundColor: '#1E2F97',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  chatHeaderPlaceholder: {
    width: 40,
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  adminMessageContainer: {
    justifyContent: 'flex-end',
  },
  studentMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  adminMessageBubble: {
    backgroundColor: '#1E2F97',
    borderBottomRightRadius: 4,
  },
  studentMessageBubble: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  adminMessageText: {
    color: '#fff',
  },
  studentMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  adminMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  studentMessageTime: {
    color: '#6B7280',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2F97',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});
