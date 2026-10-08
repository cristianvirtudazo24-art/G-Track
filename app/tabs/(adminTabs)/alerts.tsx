import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../../hooks/useUser';
import { getBroadcastNotifications, getChatMessages, getStudents, sendAnnouncement, sendChatMessage } from '../../../services/api';
import { BroadcastNotification, ChatMessage } from '../../../types/index';

type ViewMode = 'student_messages' | 'broadcast_notifications' | null;

export default function AdminAlertsScreen() {
  const { session } = useUser();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const [students, setStudents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('student_messages');
  const [selectedClass, setSelectedClass] = useState('All');
  const [showMenu, setShowMenu] = useState(false);
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastMessageCountRef = useRef(0);

  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);
  
  const [showBroadcastComposer, setShowBroadcastComposer] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [composerForm, setComposerForm] = useState({
    targetAudience: 'all',
    subjectLine: '',
    messageContent: '',
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    if (selectedStudent && viewMode === 'student_messages') {
      navigation.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else {
      navigation.setOptions({
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset : 8,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      });
    }
  }, [selectedStudent, viewMode, navigation, bottomInset]);

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

  useEffect(() => {
    if (selectedStudent) {
      setHasInitialScrolled(false);
      lastMessageCountRef.current = 0;
      setIsUserScrolling(false);
      loadChatMessages(true);
      const interval = setInterval(() => {
        loadChatMessages(false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      if (!hasInitialScrolled) {
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          setHasInitialScrolled(true);
          lastMessageCountRef.current = chatMessages.length;
        }, 100);
        return () => clearTimeout(timer);
      } else if (chatMessages.length > lastMessageCountRef.current) {
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
      const result = await sendChatMessage(selectedStudent.id, messageText, session?.dbId || undefined, session?.name || undefined);

      if (result) {
        setChatMessages(prev => [...prev, result]);

        setTimeout(() => {
          loadChatMessages(false);
        }, 500);
      } else {
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
    setHasInitialScrolled(false);
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
    if (mode === 'student_messages' || mode === 'broadcast_notifications') {
      setViewMode(mode);
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
        adminName: session?.name || undefined,
      });

      console.log('📢 [handleSendBroadcast] Result from API:', result);

      if (result) {
        console.log('✅ [handleSendBroadcast] Broadcast sent successfully');
        Alert.alert('Success', 'Announcement sent successfully!', [
          {
            text: 'OK',
            onPress: async () => {
              setComposerForm({
                targetAudience: 'all',
                subjectLine: '',
                messageContent: '',
              });
              setShowAudienceDropdown(false);
              setShowBroadcastComposer(false);

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
      case 'broadcast_notifications':
        return 'Broadcast Notifications';
      default:
        return null;
    }
  };

  const renderStudentMessages = () => (
    <View style={styles.contentContainer}>
      {/* Class Filter Horizontal Pill Bar */}
      <View style={styles.classFilterBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classFilterScroll}>
          {['All', '2026', '2027', '2028'].map((className) => (
            <TouchableOpacity
              key={className}
              style={[styles.classChip, selectedClass === className && styles.classChipActive]}
              onPress={() => handleClassSelect(className)}
              activeOpacity={0.7}
            >
              <Text style={[styles.classChipText, selectedClass === className && styles.classChipTextActive]}>
                {className === 'All' ? 'All Classes' : `Class ${className}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E2F97" />
          <Text style={styles.loadingText}>Loading student roster...</Text>
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No students found</Text>
          <Text style={styles.emptySubText}>There are no students listed under Class {selectedClass}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.studentCard}
              onPress={() => handleStudentSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarWrapper}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarInitial}>{(item.name || 'S').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={[styles.onlineDot, { backgroundColor: item.status === 'online' ? '#16A34A' : '#94A3B8' }]} />
              </View>

              <View style={styles.studentInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.studentName} numberOfLines={1}>{item.name || 'Unknown Student'}</Text>
                  <View style={styles.classPill}>
                    <Text style={styles.classPillText}>Class {item.class || '—'}</Text>
                  </View>
                </View>
                <Text style={styles.studentDetails}>ID: {item.student_id || item.id} • Tap to view chat</Text>
              </View>

              <View style={styles.chevronWrapper}>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderChatScreen = () => {
    if (!selectedStudent) return null;

    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
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
        <View style={[styles.chatHeader, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 12) : 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackFromChat}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#1E2F97" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderTitleBlock}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>{selectedStudent.name || 'Student'}</Text>
            <Text style={styles.chatHeaderSub}>Class {selectedStudent.class || '—'} • Direct Messages</Text>
          </View>

          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatAvatarText}>{(selectedStudent.name || 'S').charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.messagesContainerWrapper}>
          {chatLoading && chatMessages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E2F97" />
              <Text style={styles.loadingText}>Fetching conversation...</Text>
            </View>
          ) : chatMessages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="forum-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>Send a direct message to {selectedStudent.name}</Text>
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

        <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'ios' ? Math.max(bottomInset, 10) : 10 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
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
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderBroadcastNotifications = () => (
    <View style={styles.contentContainer}>
      {/* Compose CTA Button */}
      <TouchableOpacity
        style={styles.sendBroadcastButton}
        onPress={() => setShowBroadcastComposer(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#fff" />
        <Text style={styles.sendBroadcastButtonText}>Compose New Announcement</Text>
      </TouchableOpacity>

      <View style={styles.broadcastHeaderContainer}>
        <Text style={styles.broadcastTitle}>Broadcast Notifications Log</Text>
        <Text style={styles.broadcastSubtext}>Outbound announcements dispatched to student mobile devices.</Text>
      </View>

      {broadcastsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E2F97" />
          <Text style={styles.loadingText}>Loading broadcast logs...</Text>
        </View>
      ) : broadcasts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="broadcast-off" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No broadcast announcements</Text>
          <Text style={styles.emptySubText}>Dispatched announcements will be listed here</Text>
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
                <View style={styles.broadcastTitleRow}>
                  <Text style={styles.broadcastCardTitle}>{item.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{item.status?.toUpperCase() || 'OUTBOUND'}</Text>
                  </View>
                </View>

                <Text style={styles.broadcastMessage} numberOfLines={3}>
                  {item.message}
                </Text>

                <View style={styles.broadcastMetaRow}>
                  <View style={styles.broadcastMetaItem}>
                    <MaterialCommunityIcons name="account-tie" size={14} color="#64748B" />
                    <Text style={styles.broadcastMetaLabel}>Sent by:</Text>
                    <Text style={styles.broadcastMetaValue}>{item.sentBy || 'Admin'}</Text>
                  </View>

                  <View style={styles.broadcastMetaItem}>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color="#64748B" />
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

                <View style={styles.broadcastTimestampRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" />
                  <Text style={styles.broadcastTimestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
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
          <View style={styles.composerHeader}>
            <View>
              <Text style={styles.composerTitle}>New Announcement</Text>
              <Text style={styles.composerSubtitle}>Broadcast notification to student devices</Text>
            </View>
            <TouchableOpacity onPress={handleCancelComposer} style={styles.closeModalButton}>
              <MaterialCommunityIcons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.composerForm}
          >
            <View style={styles.composerField}>
              <Text style={styles.composerFieldLabel}>TARGET AUDIENCE</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowAudienceDropdown(!showAudienceDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {composerForm.targetAudience === 'all' ? 'All Students (Entire Roster)' : `Class ${composerForm.targetAudience}`}
                  </Text>
                  <MaterialCommunityIcons 
                    name={showAudienceDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#64748B" 
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
                          {option === 'all' ? 'All Students (Entire Roster)' : `Class ${option}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.composerField}>
              <Text style={styles.composerFieldLabel}>ANNOUNCEMENT TITLE</Text>
              <TextInput
                style={styles.composerInput}
                placeholder="Enter title or subject..."
                placeholderTextColor="#94A3B8"
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

            <View style={styles.composerField}>
              <Text style={styles.composerFieldLabel}>MESSAGE CONTENT</Text>
              <TextInput
                style={styles.composerMessageInput}
                placeholder="Type your official announcement here..."
                placeholderTextColor="#94A3B8"
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

            <View style={styles.composerActions}>
              <TouchableOpacity
                style={[styles.sendAnnouncementButton, sendingBroadcast && styles.sendAnnouncementButtonDisabled]}
                onPress={handleSendBroadcast}
                disabled={sendingBroadcast}
                activeOpacity={0.85}
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
    if (selectedStudent && viewMode === 'student_messages') {
      return renderChatScreen();
    }

    switch (viewMode) {
      case 'student_messages':
        return renderStudentMessages();
      case 'broadcast_notifications':
        return renderBroadcastNotifications();
      default:
        return renderStudentMessages();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 12) : 0 }]}>
      {selectedStudent && viewMode === 'student_messages' ? (
        renderChatScreen()
      ) : (
        <>
          {/* Main Top Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="bell-ring" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Communications</Text>
            </View>
            <Text style={styles.headerSubtitle}>Student messaging center & campus broadcast engine</Text>
          </View>

          {/* Segmented View Mode Switcher */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'student_messages' && styles.segmentBtnActive]}
              onPress={() => setViewMode('student_messages')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="message-text" 
                size={18} 
                color={viewMode === 'student_messages' ? '#1E2F97' : '#64748B'} 
              />
              <Text style={[styles.segmentText, viewMode === 'student_messages' && styles.segmentTextActive]}>
                Student Messages
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'broadcast_notifications' && styles.segmentBtnActive]}
              onPress={() => setViewMode('broadcast_notifications')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="bullhorn" 
                size={18} 
                color={viewMode === 'broadcast_notifications' ? '#1E2F97' : '#64748B'} 
              />
              <Text style={[styles.segmentText, viewMode === 'broadcast_notifications' && styles.segmentTextActive]}>
                Broadcasts
              </Text>
            </TouchableOpacity>
          </View>

          {renderContent()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 4 },
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
  classFilterBarContainer: { marginBottom: 12 },
  classFilterScroll: { gap: 8, paddingVertical: 4 },
  classChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classChipActive: {
    backgroundColor: '#1E2F97',
    borderColor: '#1E2F97',
  },
  classChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  classChipTextActive: { color: '#FFFFFF' },
  avatarWrapper: { position: 'relative', marginRight: 14 },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: '#1E40AF' },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  classPill: { backgroundColor: '#F1F5F9', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
  classPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  chevronWrapper: { paddingLeft: 6 },
  chatHeaderTitleBlock: { flex: 1 },
  chatHeaderSub: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2F97',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 4,
    borderRadius: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  segmentTextActive: { color: '#1E2F97', fontWeight: '800' },
  closeModalButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 13, color: '#1E2F97', fontWeight: '600' },
});
