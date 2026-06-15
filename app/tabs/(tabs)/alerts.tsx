import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows } from '../../../constants/theme';
import { getAdmins, getStudentNotifications, sendStudentMessage } from '../../../services/api';
import { normalizeHtml } from '../../../utils/helpers';

interface AlertItem {
  id: string;
  title?: string;
  body: string;
  time: string;
  type: 'info' | 'warning' | 'danger';
}

interface MessageItem {
  id: string;
  sender_type: 'student' | 'admin';
  message: string;
  created_at: string;
  timestamp?: number;
  adminId?: string;
}

interface AdminContact {
  id: string;
  name: string;
  email?: string;
}

interface AdminThread {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: number;
  messages: MessageItem[];
}

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; defaultTitle: string }> = {
  info: { color: '#1E2F97', bg: '#EEF2FF', icon: 'information-outline', defaultTitle: 'Announcement' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert-outline', defaultTitle: 'Security Warning' },
  danger: { color: '#EF4444', bg: '#FEE2E2', icon: 'alert-octagon-outline', defaultTitle: 'Urgent Alert' },
};

export default function AlertsScreen() {
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'messages'>('broadcasts');
  const [activeSubTab, setActiveSubTab] = useState<'unread' | 'read'>('unread');

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [adminList, setAdminList] = useState<AdminContact[]>([]);
  const [adminThreads, setAdminThreads] = useState<AdminThread[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  const loadReadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem('readAlerts');
      if (stored) {
        setReadAlertIds(JSON.parse(stored));
      }
    } catch (err) { }
  };

  const markAlertAsRead = async (id: string) => {
    if (!readAlertIds.includes(id)) {
      const newIds = [...readAlertIds, id];
      setReadAlertIds(newIds);
      try {
        await AsyncStorage.setItem('readAlerts', JSON.stringify(newIds));
      } catch (err) { }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const dbId = await AsyncStorage.getItem('userDbId');
      if (!dbId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [alertsRaw, adminsRaw] = await Promise.all([getStudentNotifications(dbId), getAdmins()]);

      const dataArray = Array.isArray(alertsRaw)
        ? alertsRaw
        : (alertsRaw?.notifications || alertsRaw?.data || []);

      // Parse admin list
      let adminContacts: AdminContact[] = [];
      if (Array.isArray(adminsRaw)) {
        adminContacts = adminsRaw
          .map((item: any) => ({
            id: String(item.id ?? item.admin_id ?? item.staff_id ?? item.sender_id ?? item.user_id ?? item.userId),
            name: item.name || item.full_name || item.admin_name || item.sender_name || item.username || item.email || 'Admin',
            email: item.email,
          }))
          .filter((item: any) => item.id);
      } else if (adminsRaw?.admins && Array.isArray(adminsRaw.admins)) {
        adminContacts = adminsRaw.admins
          .map((item: any) => ({
            id: String(item.id ?? item.admin_id ?? item.staff_id ?? item.sender_id ?? item.user_id ?? item.userId),
            name: item.name || item.full_name || item.admin_name || item.sender_name || item.username || item.email || 'Admin',
            email: item.email,
          }))
          .filter((item: any) => item.id);
      } else if (adminsRaw?.data && Array.isArray(adminsRaw.data)) {
        adminContacts = adminsRaw.data
          .map((item: any) => ({
            id: String(item.id ?? item.admin_id ?? item.staff_id ?? item.sender_id ?? item.user_id ?? item.userId),
            name: item.name || item.full_name || item.admin_name || item.sender_name || item.username || item.email || 'Admin',
            email: item.email,
          }))
          .filter((item: any) => item.id);
      }

      setAdminList(adminContacts);

      const getNotificationStudentId = (item: any) =>
        item.student_id ?? item.studentId ?? item.user_id ?? item.userId ?? item.receiver_id ?? item.recipient_id ?? item.student?.id ?? item.student?.student_id;

      const isForCurrentStudent = (item: any) => {
        const itemStudentId = getNotificationStudentId(item);
        if (itemStudentId === undefined || itemStudentId === null || itemStudentId === '') {
          return true;
        }
        return String(itemStudentId) === String(dbId);
      };

      const isMessageItem = (item: any) =>
        item.type === 'admin_reply' ||
        item.type === 'student_message' ||
        item.type === 'two_way' ||
        item.type === 'personal' ||
        item.target === 'student_message' ||
        item.sender_type === 'student' ||
        item.sender === 'student';

      const messageData = dataArray.filter((item: any) => isMessageItem(item) && isForCurrentStudent(item));
      const broadcastData = dataArray.filter((item: any) =>
        !messageData.includes(item) &&
        item.sender_type !== 'student' &&
        item.sender !== 'student' &&
        item.target !== 'student_message' &&
        item.target !== 'admin'
      );

      const mappedAlerts = broadcastData.map((item: any) => {
        return {
          id: String(item.id),
          title: normalizeHtml(item.subject || ALERT_CONFIG[item.type]?.defaultTitle || 'Broadcast Notification'),
          body: normalizeHtml(item.message || item.text || ''),
          time: formatTime(item.timestamp || item.created_at),
          type: item.type || 'info',
        };
      });

      setAlerts(mappedAlerts);

      const getAdminId = (item: any) => {
        return (
          item.admin_id ??
          item.staff_id ??
          item.sender_id ??
          item.sender?.id ??
          item.sender ??
          item.admin?.id ??
          'admin-default'
        );
      };

      const getAdminName = (item: any) => {
        return (
          item.admin_name ||
          item.sender_name ||
          item.sender?.name ||
          item.admin?.name ||
          'School Admin'
        );
      };

      const mappedMsgs = messageData.map((item: any) => {
        const itemTimestamp = item.created_at || item.timestamp || new Date().toISOString();
        const parsedTimestamp = new Date(itemTimestamp).getTime();
        return {
          id: String(item.id),
          sender_type: item.sender_type || item.sender || 'admin',
          message: item.message || item.text || '',
          created_at: formatTime(itemTimestamp),
          timestamp: parsedTimestamp,
          adminId: String(getAdminId(item)),
          adminName: getAdminName(item),
        } as any;
      });

      setMessages(mappedMsgs.reverse());

      const threadMap = new Map<string, AdminThread>();
      mappedMsgs.forEach((message: any) => {
        const threadId = String(message.adminId || 'admin-default');
        const threadName = message.adminName || 'School Admin';

        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, {
            id: threadId,
            name: threadName,
            lastMessage: message.message,
            updatedAt: message.timestamp || Date.now(),
            messages: [message],
          });
        } else {
          const thread = threadMap.get(threadId)!;
          thread.messages.push(message);
          if ((message.timestamp || 0) > thread.updatedAt) {
            thread.updatedAt = message.timestamp || 0;
            thread.lastMessage = message.message;
          }
        }
      });

      const threads = Array.from(threadMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);

      if (threads.length === 0) {
        threads.push({
          id: 'admin-default',
          name: 'School Admin',
          lastMessage: 'Start a new conversation',
          updatedAt: Date.now(),
          messages: [],
        });
      }

      setAdminThreads(threads);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReadAlerts();
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 10 * 60 * 1000);

    const sub = DeviceEventEmitter.addListener('refreshAlerts', fetchData);
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const dbId = await AsyncStorage.getItem('userDbId');
      if (!dbId) {
        alert("Session error. Please log in again.");
        return;
      }

      const res = await sendStudentMessage(
        dbId,
        replyText.trim(),
        selectedAdminId && selectedAdminId !== 'admin-default' ? selectedAdminId : undefined
      );
      if (res?.success !== false) {
        setReplyText('');
        fetchData();
        Keyboard.dismiss();
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const isRead = readAlertIds.includes(a.id);
    return activeSubTab === 'read' ? isRead : !isRead;
  });

  const unreadCount = alerts.filter(a => !readAlertIds.includes(a.id)).length;

  const selectedAdminThread = adminThreads.find(thread => thread.id === selectedAdminId);
  const selectedAdminFromList = adminList.find(admin => admin.id === selectedAdminId);
  
  const selectedAdminName = selectedAdminFromList?.name || selectedAdminThread?.name || 'Admin';
  const selectedAdminMessages = adminList.length > 0
    ? messages.filter(msg => String(msg.adminId) === String(selectedAdminId))
    : (selectedAdminThread?.messages || []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1E2F97" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts Center</Text>

        {/* Main Selector Tabs */}
        <View style={styles.mainTabsBox}>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'broadcasts' && styles.mainTabBtnActive]}
            onPress={() => setActiveTab('broadcasts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainTabText, activeTab === 'broadcasts' && styles.mainTabTextActive]}>Broadcasts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'messages' && styles.mainTabBtnActive]}
            onPress={() => {
              setActiveTab('messages');
              setSelectedAdminId(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainTabText, activeTab === 'messages' && styles.mainTabTextActive]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'broadcasts' ? (
        <View style={styles.tabContent}>
          {/* Sub Navigation Tabs */}
          <View style={styles.subTabsBox}>
            <TouchableOpacity
              style={[styles.subTabBtn, activeSubTab === 'unread' && styles.subTabBtnActive]}
              onPress={() => setActiveSubTab('unread')}
              activeOpacity={0.7}
            >
              <View style={styles.subTabLabelContainer}>
                <Text style={[styles.subTabText, activeSubTab === 'unread' && styles.subTabTextActive]}>Unread</Text>
                {unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTabBtn, activeSubTab === 'read' && styles.subTabBtnActive]}
              onPress={() => setActiveSubTab('read')}
              activeOpacity={0.7}
            >
              <Text style={[styles.subTabText, activeSubTab === 'read' && styles.subTabTextActive]}>Read</Text>
            </TouchableOpacity>
          </View>

          {/* Broadcasts List */}
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E2F97"]} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No {activeSubTab} alerts at this time.</Text>}
            renderItem={({ item }) => {
              const cfg = ALERT_CONFIG[item.type] ?? ALERT_CONFIG.info;
              const isUnread = !readAlertIds.includes(item.id);

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedAlert(item)}
                  style={styles.alertCard}
                >
                  {isUnread && <View style={styles.verticalIndicator} />}
                  <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.alertTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.alertBody} numberOfLines={2}>{item.body}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <View style={styles.chatWrapper}>
          {!selectedAdminId ? (
            <View style={styles.threadListContainer}>
              <Text style={styles.threadListHeading}>Choose an admin to message</Text>
              {adminList.length > 0 ? (
                <FlatList
                  data={adminList}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.threadList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E2F97"]} />}
                  ListEmptyComponent={<Text style={styles.emptyText}>No admins available yet.</Text>}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.threadCard}
                      onPress={() => setSelectedAdminId(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.threadInfo}>
                        <Text style={styles.threadName}>{item.name}</Text>
                        <Text style={styles.threadLast}>Tap to start a chat</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <FlatList
                  data={adminThreads}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.threadList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E2F97"]} />}
                  ListEmptyComponent={<Text style={styles.emptyText}>No admin conversations available yet.</Text>}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.threadCard}
                      onPress={() => setSelectedAdminId(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.threadInfo}>
                        <Text style={styles.threadName}>{item.name}</Text>
                        <Text style={styles.threadLast} numberOfLines={1}>{item.lastMessage}</Text>
                      </View>
                      <Text style={styles.threadTime}>{item.updatedAt ? formatTime(new Date(item.updatedAt).toISOString()) : ''}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          ) : (
            <>
              <View style={styles.chatHeader}>
                <TouchableOpacity onPress={() => setSelectedAdminId(null)} style={styles.chatBackButton} activeOpacity={0.6}>
                  <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.chatHeaderTitle}>{selectedAdminName || 'Admin Chat'}</Text>
              </View>
              <FlatList
                data={selectedAdminMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatList}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E2F97"]} />}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No conversation yet. Send your first message.
                  </Text>
                }
                renderItem={({ item }) => {
                  const isStudent = item.sender_type === 'student';
                  return (
                    <View style={[styles.bubbleWrap, isStudent ? styles.bubbleRight : styles.bubbleLeft]}>
                      <View style={[styles.bubble, isStudent ? styles.studentBubble : styles.adminBubble]}>
                        <Text style={[styles.bubbleText, isStudent ? styles.studentText : styles.adminText]}>
                          {item.message}
                        </Text>
                      </View>
                      <Text style={[styles.bubbleTime, isStudent ? { textAlign: 'right' } : { textAlign: 'left' }]}>
                        {item.created_at}
                      </Text>
                    </View>
                  );
                }}
              />
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !replyText.trim() && { opacity: 0.5 }]}
                  onPress={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Broadcast Details Modal */}
      <Modal
        visible={!!selectedAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedAlert && (() => {
              const cfg = ALERT_CONFIG[selectedAlert.type] ?? ALERT_CONFIG.info;
              const isUnread = !readAlertIds.includes(selectedAlert.id);
              return (
                <>
                  <View style={[styles.modalIconWrap, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={32} color={cfg.color} />
                  </View>
                  <Text style={[styles.modalTitle, { color: cfg.color }]}>{selectedAlert.title}</Text>
                  <Text style={styles.modalTime}>{selectedAlert.time}</Text>
                  <View style={styles.modalBodyContainer}>
                    <Text style={styles.modalBody}>{selectedAlert.body}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: cfg.color }]}
                    onPress={() => {
                      if (isUnread) markAlertAsRead(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalBtnText}>{isUnread ? 'Acknowledge' : 'Close'}</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E2F97',
    marginBottom: 16,
  },
  mainTabsBox: {
    flexDirection: 'row',
    backgroundColor: '#E5EDF9',
    borderRadius: 16,
    padding: 4,
    width: '100%',
    height: 50,
  },
  mainTabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  mainTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  mainTabText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  mainTabTextActive: {
    color: '#1E2F97',
  },
  tabContent: {
    flex: 1,
  },
  subTabsBox: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subTabBtn: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {
    borderBottomColor: '#1E2F97',
  },
  subTabText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 15,
  },
  subTabTextActive: {
    color: '#1E2F97',
    fontWeight: '800',
  },
  subTabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  threadList: {
    padding: 20,
    paddingBottom: 40,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  verticalIndicator: {
    width: 4,
    height: 32,
    backgroundColor: '#F97316',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  alertTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  alertBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 60,
    fontWeight: '500',
  },

  // Chat/Messages Styles
  chatWrapper: {
    flex: 1,
  },
  chatList: {
    padding: 20,
    paddingBottom: 100,
  },
  threadListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  threadListHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  threadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  threadInfo: {
    marginBottom: 4,
  },
  threadName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  threadLast: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  threadTime: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatBackButton: {
    marginRight: 8,
    padding: 4,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  bubbleWrap: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  adminBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  studentBubble: {
    backgroundColor: '#1E2F97',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  adminText: {
    color: '#1F2937',
  },
  studentText: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  chatInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#1F2937',
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#1E2F97',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalIconWrap: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
    fontWeight: '500',
  },
  modalBodyContainer: {
    backgroundColor: '#F3F4F6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalBody: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
