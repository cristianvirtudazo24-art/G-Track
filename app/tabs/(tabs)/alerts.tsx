import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../../../constants/theme';
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

const DEFAULT_ADMIN_CONTACTS: AdminContact[] = [
  { id: "1", name: "Stefan Flores", email: "hazelmaefernandez@gmail.com" },
  { id: "3", name: "Germaine Kalimut ko", email: "education@example.com" },
  { id: "5", name: "Nadezhda Jade Yncierto", email: "nadezhdajade.yncierto001@gmail.com" },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 36) : 44, 36);

  const [activeTab, setActiveTab] = useState<'broadcasts' | 'messages'>('broadcasts');
  const [activeSubTab, setActiveSubTab] = useState<'unread' | 'read'>('unread');

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [adminList, setAdminList] = useState<AdminContact[]>(DEFAULT_ADMIN_CONTACTS);
  const [adminThreads, setAdminThreads] = useState<AdminThread[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [readMessageIds, setReadMessageIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [newMessageAlert, setNewMessageAlert] = useState<{ id: string; sender: string } | null>(null);

  const filteredAdminList = useMemo(() => {
    if (!searchQuery.trim()) return adminList;
    const q = searchQuery.toLowerCase();
    return adminList.filter(a => a.name.toLowerCase().includes(q) || (a.email && a.email.toLowerCase().includes(q)));
  }, [adminList, searchQuery]);

  const filteredAdminThreads = useMemo(() => {
    if (!searchQuery.trim()) return adminThreads;
    const q = searchQuery.toLowerCase();
    return adminThreads.filter(t => t.name.toLowerCase().includes(q));
  }, [adminThreads, searchQuery]);

  const activeTabRef = useRef<'broadcasts' | 'messages'>('broadcasts');
  const lastMessageCountRef = useRef<number>(0);
  const messageCounterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  const markAlertAsRead = async (id: string) => {
    if (!readAlertIds.includes(id)) {
      const newIds = [...readAlertIds, id];
      setReadAlertIds(newIds);
      try {
        await AsyncStorage.setItem('readAlerts', JSON.stringify(newIds));
      } catch { }
    }
  };

  const markAllAlertsAsRead = async () => {
    const allIds = alerts.map(a => a.id);
    const merged = Array.from(new Set([...readAlertIds, ...allIds]));
    setReadAlertIds(merged);
    try {
      await AsyncStorage.setItem('readAlerts', JSON.stringify(merged));
    } catch { }
  };

  // Mark all admin-sent messages as read (used when switching to Messages tab)
  const markAllMessagesAsRead = async () => {
    const allMsgIds = messages
      .filter(m => m.sender_type !== 'student')
      .map(m => m.id);
    const merged = Array.from(new Set([...readMessageIds, ...allMsgIds]));
    setReadMessageIds(merged);
    try {
      await AsyncStorage.setItem('readMessages', JSON.stringify(merged));
    } catch { }
  };

  // Returns unread admin-sent message count for a given adminId
  const getUnreadCountForAdmin = (adminId: string): number => {
    return messages.filter(
      m => String(m.adminId) === String(adminId) &&
           m.sender_type !== 'student' &&
           !readMessageIds.includes(m.id)
    ).length;
  };

  // Mark messages from a specific admin as read
  const markAdminMessagesAsRead = async (adminId: string, threadMessages: MessageItem[]) => {
    const adminMsgIds = threadMessages
      .filter(m => m.sender_type !== 'student')
      .map(m => m.id);
    const merged = Array.from(new Set([...readMessageIds, ...adminMsgIds]));
    setReadMessageIds(merged);
    try {
      await AsyncStorage.setItem('readMessages', JSON.stringify(merged));
    } catch { }
  };

  const fetchData = useCallback(async () => {
    try {
      const storedDbId = await AsyncStorage.getItem('userDbId');
      const dbId = storedDbId || '7';

      const [alertsRaw, adminsRaw] = await Promise.all([
        getStudentNotifications(dbId),
        getAdmins()
      ]);

      const dataArray = Array.isArray(alertsRaw)
        ? alertsRaw
        : (alertsRaw?.notifications || alertsRaw?.data || []);

      // Parse admin list
      let adminContacts: AdminContact[] = [];
      const adminsRawObj: any = adminsRaw;
      if (Array.isArray(adminsRawObj)) {
        adminContacts = adminsRawObj
          .map((item: any) => ({
            id: String(item.id ?? item.admin_id ?? item.staff_id ?? item.sender_id ?? item.user_id ?? item.userId),
            name: item.name || item.full_name || item.admin_name || item.sender_name || item.username || item.email || 'Admin',
            email: item.email,
          }))
          .filter((item: any) => item.id);
      } else if (adminsRawObj?.admins && Array.isArray(adminsRawObj.admins)) {
        adminContacts = adminsRawObj.admins
          .map((item: any) => ({
            id: String(item.id ?? item.admin_id ?? item.staff_id ?? item.sender_id ?? item.user_id ?? item.userId),
            name: item.name || item.full_name || item.admin_name || item.sender_name || item.username || item.email || 'Admin',
            email: item.email,
          }))
          .filter((item: any) => item.id);
      } else if (adminsRawObj?.data && Array.isArray(adminsRawObj.data)) {
        adminContacts = adminsRawObj.data
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
        item.type === 'chat' ||
        item.type === 'message' ||
        item.target === 'student_message' ||
        item.sender_type === 'student' ||
        item.sender === 'student' ||
        (item.student_id !== null && item.student_id !== undefined && item.type !== 'broadcast');

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
        const id = (
          item.admin_id ??
          item.staff_id ??
          item.sender_id ??
          item.sender?.id ??
          item.admin?.id
        );
        if (id !== null && id !== undefined && id !== '') return String(id);
        return adminContacts[0]?.id || '1';
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
      }).sort((a: any, b: any) => a.timestamp - b.timestamp);

      setMessages(mappedMsgs);

      const threadMap = new Map<string, AdminThread>();
      mappedMsgs.forEach((message: any) => {
        const threadId = String(message.adminId || adminContacts[0]?.id || '1');
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
          if ((message.timestamp || 0) >= thread.updatedAt) {
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

      // Detect new admin messages for real-time updates
      const adminMessages = mappedMsgs.filter((msg: any) => msg.sender_type !== 'student');
      if (lastMessageCountRef.current > 0 && adminMessages.length > lastMessageCountRef.current) {
        const newestMessage = adminMessages[adminMessages.length - 1];
        setNewMessageAlert({
          id: newestMessage.id,
          sender: newestMessage.adminName || 'Admin'
        });
        // Auto-dismiss the alert after 3 seconds
        setTimeout(() => setNewMessageAlert(null), 3000);
      }
      lastMessageCountRef.current = adminMessages.length;

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initStorageAndFetch = async () => {
      try {
        const [storedAlerts, storedMsgs] = await Promise.all([
          AsyncStorage.getItem('readAlerts'),
          AsyncStorage.getItem('readMessages'),
        ]);
        if (isMounted && storedAlerts) setReadAlertIds(JSON.parse(storedAlerts));
        if (isMounted && storedMsgs) setReadMessageIds(JSON.parse(storedMsgs));
      } catch { }
      if (isMounted) {
        fetchData();
      }
    };

    initStorageAndFetch();

    // Poll more frequently for messages (5s) to enable real-time feel
    // Poll less frequently for broadcasts (5min) since they're less time-sensitive
    let interval: ReturnType<typeof setInterval> | undefined;
    
    const setupPolling = () => {
      if (activeTabRef.current === 'messages') {
        // Aggressive polling for messages tab
        interval = setInterval(() => {
          fetchData();
        }, 5000); // 5 seconds for real-time message feel
      } else {
        // Relaxed polling for broadcasts
        interval = setInterval(() => {
          fetchData();
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    setupPolling();

    const sub = DeviceEventEmitter.addListener('refreshAlerts', () => {
      fetchData();
      // Clear old messages alerts
      setNewMessageAlert(null);
    });

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, [fetchData]);

  // Restart polling with new interval when tab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
    
    // Clear any existing interval and restart with new rate
    if (messageCounterRef.current) {
      clearInterval(messageCounterRef.current);
    }
    
    if (activeTab === 'messages') {
      messageCounterRef.current = setInterval(() => {
        fetchData();
      }, 5000); // 5 seconds for messages
    } else {
      messageCounterRef.current = setInterval(() => {
        fetchData();
      }, 5 * 60 * 1000); // 5 minutes for broadcasts
    }

    return () => {
      if (messageCounterRef.current) {
        clearInterval(messageCounterRef.current);
      }
    };
  }, [activeTab, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      let dbId = await AsyncStorage.getItem('userDbId');
      if (!dbId) {
        dbId = '7';
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

  // Total unread admin messages across all threads
  const totalUnreadMessages = messages.filter(
    m => m.sender_type !== 'student' && !readMessageIds.includes(m.id)
  ).length;

  const selectedAdminThread = adminThreads.find(thread => thread.id === selectedAdminId);
  const selectedAdminFromList = adminList.find(admin => admin.id === selectedAdminId);
  const selectedAdminName = selectedAdminFromList?.name || selectedAdminThread?.name || 'Stefan Flores';

  const selectedAdminMessages = useMemo(() => {
    if (!selectedAdminId) return [];
    const isFirstAdmin = adminList.length > 0 && String(adminList[0].id) === String(selectedAdminId);
    return messages.filter(msg => {
      const msgAdminId = String(msg.adminId);
      if (msgAdminId === String(selectedAdminId)) return true;
      if (isFirstAdmin && (msgAdminId === 'admin-default' || msgAdminId === 'null' || !msg.adminId || msgAdminId === '1')) return true;
      return false;
    });
  }, [messages, selectedAdminId, adminList]);

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
      {/* Header Section (Hidden when in active chat thread) */}
      {!selectedAdminId && (
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            Alerts Center and Messaging
          </Text>

          {/* Main Selector Tabs */}
          <View style={styles.mainTabsBox}>
            <TouchableOpacity
              style={[styles.mainTabBtn, activeTab === 'broadcasts' && styles.mainTabBtnActive]}
              onPress={() => {
                setActiveTab('broadcasts');
                markAllAlertsAsRead();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.mainTabLabelRow}>
                <Text style={[styles.mainTabText, activeTab === 'broadcasts' && styles.mainTabTextActive]}>Broadcasts</Text>
                {unreadCount > 0 && (
                  <View style={styles.mainTabBadge}>
                    <Text style={styles.mainTabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mainTabBtn, activeTab === 'messages' && styles.mainTabBtnActive]}
              onPress={() => {
                setActiveTab('messages');
                setSelectedAdminId(null);
                markAllMessagesAsRead();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.mainTabLabelRow}>
                <Text style={[styles.mainTabText, activeTab === 'messages' && styles.mainTabTextActive]}>Messages</Text>
                {totalUnreadMessages > 0 && (
                  <View style={styles.mainTabBadge}>
                    <Text style={styles.mainTabBadgeText}>{totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

          {/* Acknowledge All Button - only show on Unread tab with items */}
          {activeSubTab === 'unread' && unreadCount > 0 && (
            <TouchableOpacity
              style={styles.ackAllButton}
              onPress={markAllAlertsAsRead}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check-all" size={16} color="#1E2F97" />
              <Text style={styles.ackAllText}>Acknowledge All ({unreadCount})</Text>
            </TouchableOpacity>
          )}

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
              {/* Messenger Search Bar */}
              <View style={styles.searchBarWrap}>
                <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Ask Meta AI or search admins..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Active Admins Stories Row */}
              {adminList.length > 0 && !searchQuery && (
                <View style={styles.activeAdminsSection}>
                  <Text style={styles.activeAdminsTitle}>ACTIVE ADMINS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeAdminsScroll}>
                    {adminList.map((admin) => {
                      const firstInitial = admin.name.charAt(0).toUpperCase();
                      const firstName = admin.name.split(' ')[0];
                      return (
                        <TouchableOpacity
                          key={admin.id}
                          style={styles.activeAdminBubble}
                          onPress={() => {
                            setSelectedAdminId(admin.id);
                            const threadMsgs = messages.filter(m => String(m.adminId) === String(admin.id));
                            markAdminMessagesAsRead(admin.id, threadMsgs);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.activeAdminAvatarWrap}>
                            <View style={styles.activeAdminAvatar}>
                              <Text style={styles.activeAdminAvatarText}>{firstInitial}</Text>
                            </View>
                            <View style={styles.onlineBadge} />
                          </View>
                          <Text style={styles.activeAdminName} numberOfLines={1}>
                            {firstName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.chatsSectionHeader}>CHATS</Text>

              {/* Messenger Conversation List */}
              {filteredAdminList.length > 0 ? (
                <FlatList
                  data={filteredAdminList}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.threadList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E2F97"]} />}
                  ListEmptyComponent={<Text style={styles.emptyText}>No admins found.</Text>}
                  renderItem={({ item }) => {
                    const unread = getUnreadCountForAdmin(item.id);
                    const thread = adminThreads.find(t => t.id === item.id);
                    const lastMsg = thread?.lastMessage || 'Tap to start conversation';
                    const lastMsgTime = thread?.updatedAt ? formatTime(new Date(thread.updatedAt).toISOString()) : '';

                    return (
                      <TouchableOpacity
                        style={styles.messengerThreadRow}
                        onPress={() => {
                          setSelectedAdminId(item.id);
                          const threadMsgs = messages.filter(m => String(m.adminId) === String(item.id));
                          markAdminMessagesAsRead(item.id, threadMsgs);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.messengerAvatarWrap}>
                          <View style={styles.messengerAvatar}>
                            <Text style={styles.messengerAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.onlineBadge} />
                        </View>

                        <View style={styles.messengerContent}>
                          <View style={styles.messengerTopRow}>
                            <Text style={styles.messengerName} numberOfLines={1}>{item.name}</Text>
                            {!!lastMsgTime && <Text style={styles.messengerTime}>{lastMsgTime}</Text>}
                          </View>
                          <View style={styles.messengerBottomRow}>
                            <Text
                              style={[
                                styles.messengerLastMsg,
                                unread > 0 && styles.messengerLastMsgUnread
                              ]}
                              numberOfLines={1}
                            >
                              {lastMsg}
                            </Text>
                            {unread > 0 && (
                              <View style={styles.unreadBlueDot} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              ) : (
                <FlatList
                  data={filteredAdminThreads}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.threadList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E2F97"]} />}
                  ListEmptyComponent={<Text style={styles.emptyText}>No admin conversations available yet.</Text>}
                  renderItem={({ item }) => {
                    const unread = getUnreadCountForAdmin(item.id);
                    const lastMsgTime = item.updatedAt ? formatTime(new Date(item.updatedAt).toISOString()) : '';

                    return (
                      <TouchableOpacity
                        style={styles.messengerThreadRow}
                        onPress={() => {
                          setSelectedAdminId(item.id);
                          markAdminMessagesAsRead(item.id, item.messages);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.messengerAvatarWrap}>
                          <View style={styles.messengerAvatar}>
                            <Text style={styles.messengerAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.onlineBadge} />
                        </View>

                        <View style={styles.messengerContent}>
                          <View style={styles.messengerTopRow}>
                            <Text style={styles.messengerName} numberOfLines={1}>{item.name}</Text>
                            {!!lastMsgTime && <Text style={styles.messengerTime}>{lastMsgTime}</Text>}
                          </View>
                          <View style={styles.messengerBottomRow}>
                            <Text
                              style={[
                                styles.messengerLastMsg,
                                unread > 0 && styles.messengerLastMsgUnread
                              ]}
                              numberOfLines={1}
                            >
                              {item.lastMessage}
                            </Text>
                            {unread > 0 && (
                              <View style={styles.unreadBlueDot} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          ) : (
            <>
              {/* Chat Thread Header */}
              <View style={[styles.chatHeader, { paddingTop: topInset + 8 }]}>
                <TouchableOpacity onPress={() => setSelectedAdminId(null)} style={styles.chatBackButton} activeOpacity={0.6}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.chatHeaderAvatarWrap}>
                  <View style={styles.chatHeaderAvatar}>
                    <Text style={styles.chatHeaderAvatarText}>{(selectedAdminName || 'A').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.chatHeaderOnlineDot} />
                </View>

                <View style={styles.chatHeaderTitleWrap}>
                  <Text style={styles.chatHeaderTitle}>{selectedAdminName || 'Admin Chat'}</Text>
                  <View style={styles.chatHeaderSubRow}>
                    <View style={styles.chatHeaderGreenDot} />
                    <Text style={styles.chatHeaderSubtitle}>Active Now • School Admin</Text>
                  </View>
                </View>
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

              {/* Messenger Bottom Input Bar */}
              <View style={styles.inputArea}>
                <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="plus-circle" size={26} color="#1E2F97" />
                </TouchableOpacity>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Message..."
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
                    <MaterialCommunityIcons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* New Message Alert Banner */}
      {newMessageAlert && activeTab === 'messages' && (
        <View style={styles.newMessageAlertBanner}>
          <View style={styles.newMessageAlertContent}>
            <MaterialCommunityIcons name="message-text-outline" size={18} color="#fff" />
            <View style={styles.newMessageAlertText}>
              <Text style={styles.newMessageAlertTitle}>New message from {newMessageAlert.sender}</Text>
              <Text style={styles.newMessageAlertSubtitle}>Tap the messages tab to view</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setNewMessageAlert(null)}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableOpacity>
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
    backgroundColor: '#1E2F97',
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  mainTabsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '700',
    fontSize: 14,
  },
  mainTabTextActive: {
    color: '#1E2F97',
  },
  mainTabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mainTabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  mainTabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
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
  ackAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  ackAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E2F97',
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
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  adminAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E2F97',
  },
  threadInfo: {
    flex: 1,
  },
  threadName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  threadNameUnread: {
    fontWeight: '800',
    color: '#111827',
  },
  threadLast: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  threadTime: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },
  threadCardUnread: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F7FF',
  },
  msgBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  msgBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // Messenger Search Bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 42,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 0,
  },

  // Messenger Active Admins Row
  activeAdminsSection: {
    marginBottom: 16,
  },
  activeAdminsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  activeAdminsScroll: {
    paddingHorizontal: 12,
    gap: 14,
  },
  activeAdminBubble: {
    alignItems: 'center',
    width: 62,
  },
  activeAdminAvatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  activeAdminAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E2F97',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  activeAdminAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeAdminName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },

  chatsSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginHorizontal: 12,
    marginBottom: 8,
  },

  // Messenger Row List
  messengerThreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  messengerAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  messengerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messengerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E2F97',
  },
  messengerContent: {
    flex: 1,
  },
  messengerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  messengerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  messengerTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messengerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messengerLastMsg: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  messengerLastMsgUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  unreadBlueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E2F97',
  },

  // Chat Conversation Header & View
  chatWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chatBackButton: {
    marginRight: 10,
    padding: 4,
  },
  chatHeaderAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2F97',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatHeaderOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatHeaderTitleWrap: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  chatHeaderSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  chatHeaderGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 5,
  },
  chatHeaderSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Speech Bubbles & Chat List
  chatList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  bubbleWrap: {
    marginBottom: 12,
    maxWidth: '78%',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
  },
  adminBubble: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  studentBubble: {
    backgroundColor: '#1E2F97',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  adminText: {
    color: '#111827',
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

  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 14,
  },
  attachBtn: {
    marginRight: 10,
  },
  chatInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#111827',
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#1E2F97',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
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
  newMessageAlertBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#059669',
  },
  newMessageAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  newMessageAlertText: {
    marginLeft: 12,
    flex: 1,
  },
  newMessageAlertTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  newMessageAlertSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
});
