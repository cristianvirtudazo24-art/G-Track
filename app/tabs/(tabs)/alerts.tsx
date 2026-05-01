import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../../constants/theme';
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
  info: { color: Colors.primary, bg: Colors.primaryLight, icon: 'information', defaultTitle: 'Announcement' },
  warning: { color: Colors.secondary, bg: Colors.secondaryLight, icon: 'alert', defaultTitle: 'Security Warning' },
  danger: { color: Colors.danger, bg: Colors.dangerLight, icon: 'alert-octagon', defaultTitle: 'Urgent Alert' },
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} />}
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
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
              placeholderTextColor={Colors.text.muted}
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
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl + Spacing.sm,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.text.inverse,
    marginBottom: Spacing.lg
  },
  mainTabsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.whiteAlpha[10],
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    width: '100%',
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  mainTabBtnActive: {
    backgroundColor: Colors.secondary,
  },
  mainTabText: {
    color: Colors.whiteAlpha[60],
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.sm,
  },
  mainTabTextActive: {
    color: Colors.text.inverse,
  },
  tabContent: { flex: 1 },
  subTabsBox: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  subTabBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  subTabText: {
    color: Colors.text.muted,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.md,
  },
  subTabTextActive: {
    color: Colors.primary,
  },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  alertCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    ...Shadows.md,
  },
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  iconWrap: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.lg,
    marginTop: Spacing.xs
  },
  alertContent: { flex: 1 },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs
  },
  alertTitle: {
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.md
  },
  alertTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted
  },
  alertBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 21
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: Typography.fontSize.md,
    marginTop: 60
  },

  // Chat Styles
  chatWrapper: { flex: 1 },
  chatList: {
    padding: Spacing.lg,
    paddingBottom: 120, // Increased to ensure space for input area when keyboard appears
  },
  bubbleWrap: { marginBottom: Spacing.lg, maxWidth: '85%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 60
  },
  adminBubble: {
    backgroundColor: Colors.background.primary,
    borderBottomLeftRadius: BorderRadius.xs
  },
  studentBubble: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: BorderRadius.xs
  },
  bubbleText: {
    fontSize: Typography.fontSize.md,
    lineHeight: 22
  },
  adminText: { color: Colors.text.primary },
  studentText: { color: Colors.text.inverse },
  bubbleTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.muted
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.xl, // Extra padding for Android keyboard
    ...Shadows.lg,
    marginBottom: Platform.OS === 'android' ? Spacing.md : 0, // Extra margin for Android
  },
  chatInput: {
    flex: 1,
    maxHeight: 120,
    minHeight: 45,
    backgroundColor: Colors.slate[100],
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.md,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 45,
    height: 45,
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackAlpha[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalIconWrap: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing.xl,
  },
  modalBodyContainer: {
    backgroundColor: Colors.slate[100],
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  modalBody: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalBtn: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalBtnText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
});
