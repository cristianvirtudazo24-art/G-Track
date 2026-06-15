import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlackoutAlertsScreen } from '../../../components/BlackoutAlertsScreen';
import { SOSAlertsScreen } from '../../../components/SOSAlertsScreen';
import { useUser } from '../../../hooks/useUser';
import { getAlerts, getBroadcastNotifications, getChatMessages, getStudents, sendAnnouncement, sendChatMessage } from '../../../services/api';
import { BroadcastNotification, ChatMessage } from '../../../types/index';

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  danger:  { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon', label: 'DANGER' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert',         label: 'WARNING' },
  info:    { color: '#1E2F97', bg: '#EEF2FF', icon: 'information',    label: 'INFO' },
};

type ViewMode = 'student_messages' | 'emergency_alert' | 'broadcast_notifications' | null;
type EmergencyAlertType = 'sos' | 'blackout' | null;

export default function AdminAlertsScreen() {
  const { session } = useUser();
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('student_messages');
  const [emergencyAlertType, setEmergencyAlertType] = useState<EmergencyAlertType>(null);
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
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastMessageCountRef = useRef(0);

  // Broadcast Notifications state
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);
  
  // Broadcast Composer state
  const [showBroadcastComposer, setShowBroadcastComposer] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [composerForm, setComposerForm] = useState({
    targetAudience: 'all',
    subjectLine: '',
    messageContent: '',
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    const fetchAlerts = () => {
      getAlerts().then(setAlerts);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Hide tab bar when in chat mode
  useEffect(() => {
    if (selectedStudent && viewMode === 'student_messages') {
      navigation.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else {
      navigation.setOptions({
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      });
    }
  }, [selectedStudent, viewMode, navigation]);

  useEffect(() => {
    if (viewMode === 'student_messages') {
      setLoading(true);
      getStudents().then((data) => {
        setStudents(data || []);
        setLoading(false);
      });
    } else if (viewMode === 'broadcast_notifications') {
      setBroadcastsLoading(true);
      getBroadcastNotifications().then((data) => {
        setBroadcasts(data || []);
        setBroadcastsLoading(false);
      });
    }
  }, [viewMode]);

  // Load chat messages when student is selected
  useEffect(() => {
    if (selectedStudent) {
      setHasInitialScrolled(false);
      lastMessageCountRef.current = 0;
      setIsUserScrolling(false);
      loadChatMessages(true);
      // Set up polling for new messages every 3 seconds
      const interval = setInterval(() => {
        loadChatMessages(false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedStudent]);

  // Handle scroll behavior: instantly scroll to bottom (latest conversation) on initial load,
  // and only auto-scroll on new messages if the user is already at the bottom or if they sent it.
  useEffect(() => {
    if (chatMessages.length > 0) {
      if (!hasInitialScrolled) {
        // Initial load: scroll instantly without animation
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          setHasInitialScrolled(true);
          lastMessageCountRef.current = chatMessages.length;
        }, 100);
        return () => clearTimeout(timer);
      } else if (chatMessages.length > lastMessageCountRef.current) {
        // New messages arrived: only scroll if the user is already at the bottom or it is their own message
        const lastMsg = chatMessages[chatMessages.length - 1];
        const isSelfSent = lastMsg?.sender === 'admin' || (lastMsg?.adminId && String(lastMsg.adminId) === String(session?.dbId));
        if (isSelfSent || !isUserScrolling) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
        lastMessageCountRef.current = chatMessages.length;
      }
    }
  }, [chatMessages, hasInitialScrolled, isUserScrolling, session?.dbId]);

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
        // Show error to user
        console.error('❌ Failed to send message - API returned null');
        Alert.alert(
          'Send Failed',
          'Unable to send message. Please check your connection and try again.',
          [{ text: 'OK', onPress: () => setNewMessage(messageText) }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      Alert.alert(
        'Error',
        `Failed to send message: ${error?.message || 'Unknown error'}`,
        [{ text: 'OK', onPress: () => setNewMessage(messageText) }]
      );
    } finally {
      setSending(false);
    }
  };

  const handleStudentSelect = (student: any) => {
    console.log('👤 Selected student:', student.name, 'ID:', student.id);
    setSelectedStudent(student);
    setChatMessages([]);
    setHasInitialScrolled(false); // Reset scroll state for new conversation
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
      if (mode === 'emergency_alert') {
        setEmergencyAlertType(null); // Reset to show selector
      }
      setShowMenu(false);
    }
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setShowClassMenu(false);
  };

  const handleSendBroadcast = async () => {
    if (!composerForm.subjectLine.trim() || !composerForm.messageContent.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both Subject Line and Message Content');
      return;
    }

    setSendingBroadcast(true);
    try {
      console.log('📢 [handleSendBroadcast] Starting broadcast send...');
      console.log('📢 [handleSendBroadcast] Form data:', composerForm);
      console.log('📢 [handleSendBroadcast] Admin ID:', session?.dbId);
      
      const result = await sendAnnouncement({
        title: composerForm.subjectLine,
        message: composerForm.messageContent,
        targetClass: composerForm.targetAudience as 'all' | '2026' | '2027' | '2028',
        adminId: session?.dbId || undefined,
      });

      console.log('📢 [handleSendBroadcast] Result from API:', result);

      if (result) {
        console.log('✅ [handleSendBroadcast] Broadcast sent successfully');
        Alert.alert('Success', 'Announcement sent successfully!', [
          {
            text: 'OK',
            onPress: async () => {
              // Reset form
              setComposerForm({
                targetAudience: 'all',
                subjectLine: '',
                messageContent: '',
              });
              setShowAudienceDropdown(false);
              setShowBroadcastComposer(false);

              // Reload broadcasts
              console.log('📢 [handleSendBroadcast] Reloading broadcasts...');
              const freshBroadcasts = await getBroadcastNotifications();
              console.log('📢 [handleSendBroadcast] Fresh broadcasts loaded:', freshBroadcasts?.length || 0);
              setBroadcasts(freshBroadcasts || []);
            }
          }
        ]);
      } else {
        console.error('❌ [handleSendBroadcast] API returned null/falsy result');
        Alert.alert('Error', 'Failed to send announcement. Please check your connection and try again.');
      }
    } catch (error: any) {
      console.error('❌ [handleSendBroadcast] Exception caught:', error);
      console.error('❌ [handleSendBroadcast] Error message:', error?.message);
      Alert.alert('Error', `Failed to send announcement: ${error?.message || 'Unknown error'}`);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleCancelComposer = () => {
    setShowBroadcastComposer(false);
    setShowAudienceDropdown(false);
    setComposerForm({
      targetAudience: 'all',
      subjectLine: '',
      messageContent: '',
    });
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

  const renderEmergencyAlertSelector = () => (
    <View style={styles.emergencyAlertContainer}>
      <View style={styles.emergencyAlertContent}>
        <Text style={styles.emergencyTitle}>Emergency Alerts</Text>
        <Text style={styles.emergencySubtitle}>Select alert type to view</Text>
        
        <View style={styles.emergencyButtonsContainer}>
          <TouchableOpacity
            style={[styles.emergencyButton, styles.sosButton]}
            onPress={() => setEmergencyAlertType('sos')}
            activeOpacity={0.85}
          >
            <View style={styles.emergencyButtonIcon}>
              <MaterialCommunityIcons name="alert" size={36} color="white" />
            </View>
            <Text style={styles.emergencyButtonLabel}>SOS Alerts</Text>
            <Text style={styles.emergencyButtonSub}>Videos from students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emergencyButton, styles.blackoutButton]}
            onPress={() => setEmergencyAlertType('blackout')}
            activeOpacity={0.85}
          >
            <View style={styles.emergencyButtonIcon}>
              <MaterialCommunityIcons name="lightning-bolt" size={36} color="white" />
            </View>
            <Text style={styles.emergencyButtonLabel}>Blackout Alerts</Text>
            <Text style={styles.emergencyButtonSub}>Power outage reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
      // Determine if this message is from the CURRENT admin user
      // Priority: Check adminId first, then fallback to sender type
      // If adminId exists and matches current admin -> current user's message
      // If no adminId and sender is admin -> assume current user (single admin scenario)
      // If no adminId and sender is student -> student's message
      const isCurrentUserMessage = (
        (item.adminId && String(item.adminId) === String(session?.dbId)) ||
        (item.sender === 'admin' && !item.adminId && session?.dbId) ||
        (item.sender === 'admin' && !session?.dbId)
      );
      
      const messageTime = new Date(item.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return (
        <View
          style={[
            styles.messageContainer,
            isCurrentUserMessage ? styles.adminMessageContainer : styles.studentMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isCurrentUserMessage ? styles.adminMessageBubble : styles.studentMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isCurrentUserMessage ? styles.adminMessageText : styles.studentMessageText,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isCurrentUserMessage ? styles.adminMessageTime : styles.studentMessageTime,
              ]}
            >
              {messageTime}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.chatScreenContainer}
      >
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

        {/* Messages Container */}
        <View style={styles.messagesContainerWrapper}>
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
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              removeClippedSubviews={false}
              keyboardShouldPersistTaps="handled"
              onScroll={(event) => {
                const contentOffsetY = event.nativeEvent.contentOffset.y;
                const contentHeight = event.nativeEvent.contentSize.height;
                const layoutHeight = event.nativeEvent.layoutMeasurement.height;
                const isAtBottom = contentHeight - layoutHeight - contentOffsetY < 10;
                setIsUserScrolling(!isAtBottom);
              }}
              scrollEventThrottle={16}

            />
          )}
        </View>

        {/* Message Input */}
        <View style={styles.inputContainer}>
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
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderBroadcastNotifications = () => (
    <View style={styles.contentContainer}>
      {/* Send New Broadcast Button */}
      <TouchableOpacity
        style={styles.sendBroadcastButton}
        onPress={() => setShowBroadcastComposer(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.sendBroadcastButtonText}>Send New Broadcast</Text>
      </TouchableOpacity>

      <View style={styles.broadcastHeaderContainer}>
        <Text style={styles.broadcastTitle}>All Classes</Text>
        <Text style={styles.broadcastDescription}>Broadcast Notifications History</Text>
        <Text style={styles.broadcastSubtext}>Detailed log of all outbound school-wide announcements.</Text>
      </View>

      {broadcastsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E2F97" />
        </View>
      ) : broadcasts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="broadcast-off" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No broadcast notifications</Text>
          <Text style={styles.emptySubText}>Broadcast announcements will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.broadcastList}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <View style={styles.broadcastCard}>
              <View style={styles.broadcastCardContent}>
                {/* Title and Status Badge */}
                <View style={styles.broadcastTitleRow}>
                  <Text style={styles.broadcastCardTitle}>{item.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{item.status?.toUpperCase() || 'OUTBOUND'}</Text>
                  </View>
                </View>

                {/* Message Preview */}
                <Text style={styles.broadcastMessage} numberOfLines={2}>
                  {item.message}
                </Text>

                {/* Meta Information */}
                <View style={styles.broadcastMetaRow}>
                  <View style={styles.broadcastMetaItem}>
                    <Text style={styles.broadcastMetaLabel}>Sent by:</Text>
                    <Text style={styles.broadcastMetaValue}>{item.sentBy}</Text>
                  </View>

                  <View style={styles.broadcastMetaItem}>
                    <Text style={styles.broadcastMetaLabel}>Class:</Text>
                    <Text style={styles.broadcastMetaValue}>
                      {Array.isArray(item.targetClasses) && item.targetClasses.length > 0
                        ? item.targetClasses.join(', ')
                        : item.targetClass === 'all'
                        ? 'All Classes'
                        : item.targetClass || 'All'}
                    </Text>
                  </View>
                </View>

                {/* Timestamp */}
                <View style={styles.broadcastTimestampRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                  <Text style={styles.broadcastTimestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>

                {/* Sent to All Link */}
                <TouchableOpacity style={styles.sentToAllButton}>
                  <Text style={styles.sentToAllLink}>Sent to All</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Broadcast Composer Modal */}
      <Modal
        visible={showBroadcastComposer}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCancelComposer}
      >
        <SafeAreaView style={styles.composerContainer}>
          {/* Composer Header */}
          <View style={styles.composerHeader}>
            <View>
              <Text style={styles.composerTitle}>Compose New Broadcast</Text>
              <Text style={styles.composerSubtitle}>Prepare and send an announcement to students</Text>
            </View>
            <TouchableOpacity onPress={handleCancelComposer}>
              <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.composerForm}
          >
            {/* Target Audience Dropdown */}
            <View style={styles.composerField}>
              <Text style={styles.composerFieldLabel}>TARGET AUDIENCE</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowAudienceDropdown(!showAudienceDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {composerForm.targetAudience === 'all' ? 'All Students' : `Class ${composerForm.targetAudience}`}
                  </Text>
                  <MaterialCommunityIcons 
                    name={showAudienceDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
                {showAudienceDropdown && (
                  <View style={styles.dropdownMenu}>
                    {['all', '2026', '2027', '2028'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownMenuItem,
                          composerForm.targetAudience === option && styles.dropdownMenuItemActive,
                        ]}
                        onPress={() => {
                          setComposerForm((prev) => ({
                            ...prev,
                            targetAudience: option,
                          }));
                          setShowAudienceDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            composerForm.targetAudience === option && styles.dropdownMenuItemTextActive,
                          ]}
                        >
                          {option === 'all' ? 'All Students' : `Class ${option}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Subject Line */}
            <View style={styles.composerField}>
              <Text style={styles.composerFieldLabel}>SUBJECT LINE</Text>
              <TextInput
                style={styles.composerInput}
                placeholder="Enter subject Title..."
                placeholderTextColor="#9CA3AF"
                value={composerForm.subjectLine}
                onChangeText={(text) =>
                  setComposerForm((prev) => ({
                    ...prev,
                    subjectLine: text,
                  }))
                }
                maxLength={100}
              />
            </View>

            {/* Message Content */}
            <View style={styles.composerField}>
              <Text style={styles.composerFieldLabel}>MESSAGE CONTENT (RICH TEXT)</Text>
              <TextInput
                style={styles.composerMessageInput}
                placeholder="Type your announcement here..."
                placeholderTextColor="#9CA3AF"
                value={composerForm.messageContent}
                onChangeText={(text) =>
                  setComposerForm((prev) => ({
                    ...prev,
                    messageContent: text,
                  }))
                }
                multiline={true}
                maxLength={1000}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.composerActions}>
              <TouchableOpacity
                style={[styles.sendAnnouncementButton, sendingBroadcast && styles.sendAnnouncementButtonDisabled]}
                onPress={handleSendBroadcast}
                disabled={sendingBroadcast}
              >
                {sendingBroadcast ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendAnnouncementButtonText}>Send Announcement Now</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelComposer}
                disabled={sendingBroadcast}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );

  const renderContent = () => {
    // If a student is selected, show chat screen
    if (selectedStudent && viewMode === 'student_messages') {
      return renderChatScreen();
    }

    switch (viewMode) {
      case 'student_messages':
        return renderStudentMessages();
      case 'emergency_alert':
        // Show selector if no emergency type selected
        if (!emergencyAlertType) {
          return renderEmergencyAlertSelector();
        }
        // Show SOS alerts
        if (emergencyAlertType === 'sos') {
          return <SOSAlertsScreen onBackPress={() => setEmergencyAlertType(null)} />;
        }
        // Show Blackout alerts
        if (emergencyAlertType === 'blackout') {
          return <BlackoutAlertsScreen onBackPress={() => setEmergencyAlertType(null)} />;
        }
        return renderEmergencyAlertSelector();
      case 'broadcast_notifications':
        return renderBroadcastNotifications();
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
  messagesContainerWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 8,
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
    paddingBottom: Platform.OS === 'ios' ? 0 : 0,
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
  // Emergency Alert Styles
  emergencyAlertContainer: {
    flex: 1,
    backgroundColor: '#F5F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emergencyAlertContent: {
    alignItems: 'center',
    width: '100%',
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  emergencyButtonsContainer: {
    width: '100%',
    gap: 16,
  },
  emergencyButton: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sosButton: {
    backgroundColor: '#E8313A',
  },
  blackoutButton: {
    backgroundColor: '#F97316',
  },
  emergencyButtonIcon: {
    marginBottom: 12,
  },
  emergencyButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  emergencyButtonSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Broadcast Notifications Styles
  broadcastHeaderContainer: {
    backgroundColor: '#1E9FD8',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 0,
  },
  broadcastTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  broadcastDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  broadcastSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  broadcastList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  broadcastCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#1E9FD8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  broadcastCardContent: {
    flex: 1,
  },
  broadcastTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  broadcastCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },
  broadcastMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  broadcastMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  broadcastMetaItem: {
    flex: 1,
  },
  broadcastMetaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  broadcastMetaValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  broadcastTimestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  broadcastTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  sentToAllButton: {
    paddingVertical: 8,
  },
  sentToAllLink: {
    fontSize: 13,
    color: '#1E9FD8',
    fontWeight: '600',
  },
  // Send Broadcast Button
  sendBroadcastButton: {
    backgroundColor: '#1E9FD8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sendBroadcastButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Composer Styles
  composerContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  composerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  composerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  composerForm: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  composerField: {
    marginBottom: 20,
  },
  composerFieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  composerInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  composerMessageInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 150,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownMenuItemTextActive: {
    color: '#1E2F97',
    fontWeight: '600',
  },
  composerActions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendAnnouncementButton: {
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E9FD8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sendAnnouncementButtonDisabled: {
    opacity: 0.6,
  },
  sendAnnouncementButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
