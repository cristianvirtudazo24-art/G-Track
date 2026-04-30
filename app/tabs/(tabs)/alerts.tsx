import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getStudentNotifications, sendStudentMessage } from '../../../services/api';

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
}

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; defaultTitle: string }> = {
  info: { color: '#1E2F97', bg: '#EEF2FF', icon: 'information', defaultTitle: 'Announcement' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert', defaultTitle: 'Security Warning' },
  danger: { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon', defaultTitle: 'Urgent Alert' },
};

export default function AlertsScreen() {
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'messages'>('broadcasts');
  const [activeSubTab, setActiveSubTab] = useState<'unread' | 'read'>('unread');

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
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

      const alertsRaw = await getStudentNotifications(dbId);

      const dataArray = Array.isArray(alertsRaw)
        ? alertsRaw
        : (alertsRaw?.notifications || alertsRaw?.data || []);

      const isMessageItem = (item: any) =>
        item.type === 'admin_reply' ||
        item.type === 'student_message' ||
        item.type === 'two_way' ||
        item.type === 'personal' ||
        item.target === 'student_message' ||
        item.sender_type === 'student' ||
        item.sender === 'student';

      const messageData = dataArray.filter(isMessageItem);
      const broadcastData = dataArray.filter((item: any) =>
        !messageData.includes(item) &&
        item.sender_type !== 'student' &&
        item.sender !== 'student' &&
        item.target !== 'student_message' &&
        item.target !== 'admin'
      );

      const mappedAlerts = broadcastData.map((item: any) => ({
        id: String(item.id),
        title: item.title || ALERT_CONFIG[item.type]?.defaultTitle || 'Admin Broadcast',
        body: item.text || item.message || 'No message content',
        time: formatTime(item.timestamp || item.created_at),
        type: item.type || 'info'
      }));

      setAlerts(mappedAlerts);

      const mappedMsgs = messageData.map((item: any) => ({
        id: String(item.id),
        sender_type: item.sender_type || item.sender || 'admin',
        message: item.message || item.text || '',
        created_at: formatTime(item.created_at || new Date().toISOString())
      }));

      setMessages(mappedMsgs.reverse());

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

    // 10-minute auto-refresh polling
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

      const res = await sendStudentMessage(dbId, replyText.trim());
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts Center</Text>

        {/* Main Tabs */}
        <View style={styles.mainTabsBox}>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'broadcasts' && styles.mainTabBtnActive]}
            onPress={() => setActiveTab('broadcasts')}
          >
            <Text style={[styles.mainTabText, activeTab === 'broadcasts' && styles.mainTabTextActive]}>Broadcasts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeTab === 'messages' && styles.mainTabBtnActive]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[styles.mainTabText, activeTab === 'messages' && styles.mainTabTextActive]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'broadcasts' ? (
        <View style={styles.tabContent}>
          {/* Sub Tabs */}
          <View style={styles.subTabsBox}>
            <TouchableOpacity
              style={[styles.subTabBtn, activeSubTab === 'unread' && styles.subTabBtnActive]}
              onPress={() => setActiveSubTab('unread')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'unread' && styles.subTabTextActive]}>Unread</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTabBtn, activeSubTab === 'read' && styles.subTabBtnActive]}
              onPress={() => setActiveSubTab('read')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'read' && styles.subTabTextActive]}>Read</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No {activeSubTab} alerts at this time.</Text>}
            renderItem={({ item }) => {
              const cfg = ALERT_CONFIG[item.type] ?? ALERT_CONFIG.info;
              const isUnread = !readAlertIds.includes(item.id);

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedAlert(item)}
                  style={[styles.alertCard, isUnread && styles.alertCardUnread]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertTitle, { color: cfg.color }]}>{item.title}</Text>
                      <Text style={styles.alertTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.alertBody}>{item.body}</Text>
                  </View>
                  {isUnread && <View style={styles.unreadIndicator} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <View style={styles.chatWrapper}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E2F97']} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No messages yet. Send a query below.
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
                  <Text style={[styles.bubbleTime, isStudent ? { textAlign: 'right', marginTop: 4 } : { textAlign: 'left', marginTop: 4 }]}>
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
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Broadcast Modal */}
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
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 15 },
  mainTabsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 4,
    width: '100%',
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  mainTabBtnActive: {
    backgroundColor: '#F97316',
  },
  mainTabText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 14,
  },
  mainTabTextActive: {
    color: '#fff',
  },
  tabContent: { flex: 1 },
  subTabsBox: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    justifyContent: 'center',
    gap: 20,
  },
  subTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    position: 'absolute',
    top: 20,
    right: 15,
  },
  iconWrap: { padding: 10, borderRadius: 14, marginRight: 14, marginTop: 2 },
  alertContent: { flex: 1 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  alertTitle: { fontWeight: '700', fontSize: 15 },
  alertTime: { fontSize: 12, color: '#9CA3AF' },
  alertBody: { fontSize: 14, color: '#4B5563', lineHeight: 21 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16, marginTop: 60 },

  // Chat Styles
  chatWrapper: { flex: 1 },
  chatList: {
    padding: 20,
    paddingBottom: 10,
  },
  bubbleWrap: { marginBottom: 15, maxWidth: '85%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: { padding: 14, borderRadius: 20, minWidth: 60 },
  adminBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 5 },
  studentBubble: { backgroundColor: '#F97316', borderBottomRightRadius: 5 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  adminText: { color: '#1f2937' },
  studentText: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#9CA3AF' },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 10, // increased elevation to ensure it sits on top beautifully
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  chatInput: {
    flex: 1,
    maxHeight: 120,
    minHeight: 45,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#1f2937',
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#1E2F97', // Changed from #F97316 to #1E2F97 to match the image precisely
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalIconWrap: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalTime: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  modalBodyContainer: {
    backgroundColor: '#F3F4F6',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalBody: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'center',
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
