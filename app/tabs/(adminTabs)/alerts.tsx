import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { getAlerts } from '../../../services/api';

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  danger:  { color: '#E8313A', bg: '#FEE2E2', icon: 'alert-octagon', label: 'DANGER' },
  warning: { color: '#F97316', bg: '#FFF7ED', icon: 'alert',         label: 'WARNING' },
  info:    { color: '#1E2F97', bg: '#EEF2FF', icon: 'information',    label: 'INFO' },
};

export default function AdminAlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = () => {
      getAlerts().then(setAlerts);
    };

<<<<<<< Updated upstream
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);
=======
  // ── Filtered students ──────────────────────────────────────────────────────
  const filteredStudents = selectedClass === 'All'
    ? students
    : students.filter(s => String(s.class) === selectedClass);

  // ── Broadcast ─────────────────────────────────────────────────────────────
  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    await sendAnnouncement({ message: broadcastMsg.trim(), targetClass: broadcastClass });
    setBroadcastSent(true);
    setBroadcastMsg('');
    setBroadcastSending(false);
    setTimeout(() => setBroadcastSent(false), 3500);
  };

  // ── Menu animation ─────────────────────────────────────────────────────────
  const openMenu = () => {
    setMenuVisible(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    setMenuVisible(false);
    setClassMenuVisible(false);
    setActiveStudent(null); // reset chat when switching mode
  };

  const selectClass = (cls: string) => {
    setSelectedClass(cls);
    setClassMenuVisible(false);
    setMenuVisible(false);
  };

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <>
      <SafeAreaView style={styles.safeArea}>

      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSub}>Send and manage notifications</Text>
      </View>

      {/* Mode Bar */}
      <View style={styles.modeBar}>
        <View style={styles.modeBarLeft}>
          <Text style={styles.modeBarLabel}>{mode}</Text>
          {mode === 'Student Messages' && selectedClass !== 'All' && (
            <Text style={styles.modeBarSub}>Class {selectedClass}</Text>
          )}
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.plusBtn} onPress={openMenu} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={20} color="#1E2F97" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal transparent animationType="fade" visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => { setMenuVisible(false); setClassMenuVisible(false); }}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuCard}>
                {!classMenuVisible ? (
                  <>
                    <Text style={styles.menuTitle}>Select View</Text>
                    {MODES.map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.menuItem, mode === m && styles.menuItemActive]}
                        onPress={() => selectMode(m)}
                      >
                        <MaterialCommunityIcons
                          name={
                            m === 'Student Messages' ? 'message-text-outline' :
                            m === 'Emergency Alerts' ? 'alert-circle-outline' :
                            'bullhorn-outline'
                          }
                          size={18}
                          color={mode === m ? '#fff' : '#1E2F97'}
                        />
                        <Text style={[styles.menuItemText, mode === m && styles.menuItemTextActive]}>{m}</Text>
                        {mode === m && (
                          <MaterialCommunityIcons name="check" size={16} color="#fff" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    ))}
                    <View style={styles.menuDivider} />
                    <TouchableOpacity style={styles.menuItem} onPress={() => setClassMenuVisible(true)}>
                      <MaterialCommunityIcons name="filter-outline" size={18} color="#1E2F97" />
                      <Text style={styles.menuItemText}>Filter By Class</Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.backRow} onPress={() => setClassMenuVisible(false)}>
                      <MaterialCommunityIcons name="arrow-left" size={18} color="#1E2F97" />
                      <Text style={styles.menuTitle}>Filter By Class</Text>
                    </TouchableOpacity>
                    {CLASSES.map(cls => (
                      <TouchableOpacity
                        key={cls}
                        style={[styles.menuItem, selectedClass === cls && styles.menuItemActive]}
                        onPress={() => selectClass(cls)}
                      >
                        <MaterialCommunityIcons name="school-outline" size={18} color={selectedClass === cls ? '#fff' : '#1E2F97'} />
                        <Text style={[styles.menuItemText, selectedClass === cls && styles.menuItemTextActive]}>
                          {cls === 'All' ? 'All Classes' : `Class ${cls}`}
                        </Text>
                        {selectedClass === cls && (
                          <MaterialCommunityIcons name="check" size={16} color="#fff" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Content Panels */}
      {mode === 'Student Messages' && (
        <StudentListPanel
          students={filteredStudents}
          loading={stuLoading}
          onSelectStudent={setActiveStudent}
        />
      )}
      {mode === 'Emergency Alerts' && (
        <EmergencyAlertsPanel alerts={alerts} loading={alertLoading} onRefresh={fetchAlerts} />
      )}
      {mode === 'Broadcast Notification' && (
        <BroadcastPanel
          message={broadcastMsg}
          setMessage={setBroadcastMsg}
          broadcastClass={broadcastClass}
          setBroadcastClass={(bc: string) => setBroadcastClass(bc as 'all' | '2026' | '2027' | '2028')}
          sending={broadcastSending}
          sent={broadcastSent}
          onSend={handleBroadcast}
        />
      )}

      </SafeAreaView>

      {/* ── Full-screen Chat Modal (hides tab bar) ────────────────────────── */}
      <Modal
        visible={!!activeStudent}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setActiveStudent(null)}
      >
        {activeStudent && (
          <ChatScreen
            student={activeStudent}
            onBack={() => setActiveStudent(null)}
          />
        )}
      </Modal>
    </>
  );
}

// ─── Student List Panel (tap to open chat) ────────────────────────────────────
function StudentListPanel({ students, loading, onSelectStudent }: any) {
  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#1E2F97" />
        <Text style={styles.loadingText}>Loading students…</Text>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={styles.centerBox}>
        <MaterialCommunityIcons name="account-group-outline" size={52} color="#D1D5DB" />
        <Text style={styles.emptyText}>No students found for this class.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={students}
      keyExtractor={item => String(item.id ?? item.student_id ?? Math.random())}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const name = item.name || 'Unknown Student';
        const cls  = item.class ? `Class ${item.class}` : '—';
        const sid  = item.student_id || item.id || '—';

        return (
          <TouchableOpacity
            style={styles.studentCard}
            onPress={() => onSelectStudent(item)}
            activeOpacity={0.75}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{name}</Text>
              <Text style={styles.studentMeta}>{sid} · {cls}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Full-Screen Chat Screen ──────────────────────────────────────────────────
function ChatScreen({ student, onBack }: { student: any; onBack: () => void }) {
  const name = student.name || 'Unknown Student';
  const id   = String(student.student_id || student.id || '');
  const cls  = student.class ? `Class ${student.class}` : '—';

  const [messages, setMessages]   = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Load existing notifications/messages for this student
  const loadMessages = useCallback(async () => {
    try {
      const data = await getStudentNotifications(id);
      // Normalize to array, oldest-first
      let list = Array.isArray(data) ? data : (data?.notifications ?? data?.data ?? []);
      
      // Sort messages chronologically (oldest at the top of the array, newest at the bottom)
      list = [...list].sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      // Strict Data Segregation: Client-side filter to completely block cross-chatter 
      // where the backend might be ignoring the targeted query IDs.
      list = list.filter((msg: any) => {
        if (!msg.student_id) return true; // Broadcasts or unlabeled
        const sid = String(msg.student_id);
        return sid === String(student.id) || sid === String(student.student_id);
      });

      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, [id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    // Optimistically append admin bubble
    const optimistic = { id: `opt-${Date.now()}`, message: text, sender_type: 'admin', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    await sendStudentMessage(id, text, undefined, 'admin');
    setSending(false);
    // Reload to get server-confirmed messages
    loadMessages();
  };
>>>>>>> Stashed changes

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Reports</Text>
        <Text style={styles.headerSubtitle}>Real-time alerts & student emergencies</Text>
      </View>

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
<<<<<<< Updated upstream
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertType, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.alertTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
=======
            )}
            {messages.map((msg, idx) => {
              const isAdmin = 
                String(msg.sender).toLowerCase() === 'admin' || 
                String(msg.sender_type).toLowerCase() === 'admin' ||
                msg.is_admin === true ||
                msg.is_admin === 1 || 
                msg.admin_id != null || 
                String(msg.source).toLowerCase() === 'admin';

              const timeLabel = msg.created_at || msg.timestamp
                ? new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <View key={msg.id ?? idx} style={[styles.bubbleRow, isAdmin ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                  {!isAdmin && (
                    <View style={styles.bubbleAvatar}>
                      <Text style={styles.bubbleAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleStudent]}>
                    <Text style={[styles.bubbleText, isAdmin ? styles.bubbleTextAdmin : styles.bubbleTextStudent]}>
                      {msg.message || msg.text || ''}
                    </Text>
                    {timeLabel ? (
                      <Text style={[styles.bubbleTime, isAdmin ? styles.bubbleTimeAdmin : styles.bubbleTimeStudent]}>
                        {timeLabel}
                      </Text>
                    ) : null}
                  </View>
>>>>>>> Stashed changes
                </View>
                <Text style={styles.alertBody}>{item.text}</Text>
                <Text style={styles.alertStudentId}>Student ID: {item.studentId}</Text>
              </View>
            </View>
          );
        }}
      />
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
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16, marginTop: 60 },
});
