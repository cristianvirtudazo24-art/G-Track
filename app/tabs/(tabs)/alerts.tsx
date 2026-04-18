import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FlatList, StyleSheet, Text, View, RefreshControl, 
  ActivityIndicator, DeviceEventEmitter, TouchableOpacity, 
  ScrollView, useWindowDimensions, Modal, TextInput, 
  KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStudentNotifications, sendStudentMessage } from '../../../services/api';

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  info:    { color: '#1E2F97', bg: '#EEF2FF', icon: 'information' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert' },
  danger:  { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon' },
  broadcast: { color: '#1E2F97', bg: '#EEF2FF', icon: 'bullhorn-variant' },
  personal: { color: '#F97316', bg: '#FFF7ED', icon: 'message-text' },
};

export default function AlertsScreen() {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [activeTab, setActiveTab] = useState<'broadcast' | 'messages'>('broadcast');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const dbId = await AsyncStorage.getItem('userDbId');
      if (!dbId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await getStudentNotifications(dbId);
      const data = res?.notifications || [];

      setBroadcasts(data.filter((n: any) => n.type === 'broadcast'));
      setMessages(data.filter((n: any) => n.type !== 'broadcast').reverse()); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const sub = DeviceEventEmitter.addListener('refreshAlerts', fetchNotifications);
    return () => sub.remove();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
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
      if (res?.success) {
        setReplyText('');
        fetchNotifications();
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const switchTab = (tab: 'broadcast' | 'messages', index: number) => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setActiveTab(index === 0 ? 'broadcast' : 'messages');
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1E2F97" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts Center</Text>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'broadcast' && styles.activeTab]}
            onPress={() => switchTab('broadcast', 0)}
          >
            <Text style={[styles.tabText, activeTab === 'broadcast' && styles.activeTabText]}>Broadcasts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => switchTab('messages', 1)}
          >
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <FlatList
            data={broadcasts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listPadding}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No broadcasts found.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.card} 
                onPress={() => { setSelectedAlert(item); setShowDetail(true); }}
              >
                <View style={[styles.iconBox, { backgroundColor: ALERT_CONFIG.broadcast.bg }]}>
                  <MaterialCommunityIcons name="bullhorn-variant" size={24} color={ALERT_CONFIG.broadcast.color} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Announcement</Text>
                    <Text style={styles.cardTime}>{formatTime(item.created_at)}</Text>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>{item.message}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={{ width }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            keyboardVerticalOffset={100}
            style={{ flex: 1 }}
          >
            <FlatList
              data={messages}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.msgListPadding}
              inverted={false}
              renderItem={({ item }) => {
                const isAdmin = item.sender_type === 'admin';
                return (
                  <View style={[styles.bubbleWrap, isAdmin ? styles.bubbleLeft : styles.bubbleRight]}>
                    <View style={[styles.bubble, isAdmin ? styles.adminBubble : styles.studentBubble]}>
                      <Text style={[styles.bubbleText, isAdmin ? styles.adminText : styles.studentText]}>{item.message}</Text>
                    </View>
                    <Text style={styles.bubbleTime}>{formatTime(item.created_at)}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No messages yet. Send a query to Admin below.</Text>}
            />
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !replyText.trim() && { opacity: 0.5 }]} 
                onPress={handleSendReply}
                disabled={sending || !replyText.trim()}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="send" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Broadcast Details</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1E2F97" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>{selectedAlert?.message}</Text>
              <Text style={styles.modalTime}>{new Date(selectedAlert?.created_at).toLocaleString()}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1E2F97', paddingTop: 60, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 15 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: '#F97316' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  activeTabText: { color: '#fff' },
  listPadding: { padding: 20 },
  msgListPadding: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  cardTitle: { fontWeight: '700', color: '#1E2F97', fontSize: 13 },
  cardTime: { fontSize: 11, color: '#9CA3AF' },
  cardBody: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 100, color: '#9CA3AF', fontWeight: '600' },
  bubbleWrap: { marginBottom: 15, maxWidth: '85%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: { padding: 12, borderRadius: 20, minWidth: 60 },
  adminBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 5 },
  studentBubble: { backgroundColor: '#F97316', borderBottomRightRadius: 5 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  adminText: { color: '#1E2F97' },
  studentText: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  inputBar: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 5, elevation: 5 },
  input: { flex: 1, maxHeight: 100, paddingVertical: 10, color: '#1E2F97', fontSize: 15 },
  sendBtn: { backgroundColor: '#1E2F97', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E2F97' },
  modalScroll: { marginBottom: 10 },
  modalBody: { fontSize: 16, color: '#4B5563', lineHeight: 24 },
  modalTime: { fontSize: 12, color: '#9CA3AF', marginTop: 15, textAlign: 'right' },
});