import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Network';
import { BlackoutAlert, ChatMessage, SOSAlertVideo } from '../types/index';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'GTrack-Mobile/1.0 (Student Tracking System)', // Comply with tile server policies
  },
});

const MOCK_STUDENTS = [
  { id: 1, name: "Cristian Virtudazo", student_id: "2026-0001", class: "2026" },
  { id: 2, name: "Maria Clara", student_id: "2026-0002", class: "2026" },
  { id: 3, name: "Jose Rizal", student_id: "2027-0001", class: "2027" },
  { id: 4, name: "Andres Bonifacio", student_id: "2028-0001", class: "2028" },
];

const MOCK_LOCATIONS = [
  {
    id: 1,
    student_id: 1,
    student: { id: 1, name: "Cristian Virtudazo", student_id: "2026-0001" },
    sos_status: "safe",
    latitude: 10.2952,
    longitude: 123.8955,
    recorded_at: new Date().toISOString(),
  },
  {
    id: 2,
    student_id: 2,
    student: { id: 2, name: "Maria Clara", student_id: "2026-0002" },
    sos_status: "help",
    latitude: 10.2965,
    longitude: 123.8970,
    recorded_at: new Date().toISOString(),
  },
];

const MOCK_BROADCASTS = [
  {
    id: "b1",
    title: "Weather Advisory",
    message: "Classes are suspended due to heavy rain. Please stay indoors.",
    sentBy: "School Admin",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    targetClass: "all",
    targetClasses: ["All"],
    status: "outbound",
    type: "broadcast",
  }
];

const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  "1": [
    { id: "m1", sender: "student", text: "Hello admin, I am currently at the library.", timestamp: new Date(Date.now() - 3600000).toISOString(), senderName: "Student" },
    { id: "m2", sender: "admin", text: "Understood, stay safe.", timestamp: new Date(Date.now() - 3500000).toISOString(), senderName: "Admin", adminId: "1" },
  ],
  "2": [
    { id: "m3", sender: "student", text: "I need help with my location sync.", timestamp: new Date(Date.now() - 1800000).toISOString(), senderName: "Student" },
  ]
};

export const getStudents = async () => {
  try {
    const response = await apiClient.get('/status/all');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Students Failed, using mock fallback", error);
    return MOCK_STUDENTS; 
  }
};

export const getAlerts = async () => {
  try {
    const response = await apiClient.get('/location/all');
    const locations = response.data || [];
    
    return locations
      .filter((loc: any) => loc.sos_status === 'help')
      .map((loc: any) => ({
        id: String(loc.id),
        type: 'danger',
        text: `SOS Alert: ${loc.student?.name || 'Unknown Student'}`,
        timestamp: loc.recorded_at,
        studentId: loc.student?.student_id
      }));
  } catch (error) {
    console.error("❌ API Error: Fetch Alerts Failed, using mock fallback", error);
    return MOCK_LOCATIONS
      .filter((loc: any) => loc.sos_status === 'help')
      .map((loc: any) => ({
        id: String(loc.id),
        type: 'danger',
        text: `SOS Alert: ${loc.student?.name || 'Unknown Student'}`,
        timestamp: loc.recorded_at,
        studentId: loc.student?.student_id
      }));
  }
};

export const getRecentLocations = async () => {
  try {
    const response = await apiClient.get('/location/all');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Locations Failed, using mock fallback", error);
    return MOCK_LOCATIONS;
  }
};

export const getStudentStatus = async (studentId: string | number) => {
  try {
    const locations = await getRecentLocations();
    const studentLocation = locations.find((loc: any) => String(loc.student?.id) === String(studentId) || String(loc.student?.student_id) === String(studentId));
    return studentLocation || null;
  } catch (error) {
    console.error("❌ API Error: Fetch Student Status Failed", error);
    return null;
  }
};

const DEFAULT_ADMINS = [
  { id: "1", name: "Stefan Flores", email: "hazelmaefernandez@gmail.com" },
  { id: "3", name: "Germaine Kalimut ko", email: "education@example.com" },
  { id: "5", name: "Nadezhda Jade Yncierto", email: "nadezhdajade.yncierto001@gmail.com" },
];

export const getAdmins = async () => {
  try {
    const response = await apiClient.get('/admins');
    const rawData = response.data?.admins || response.data || [];
    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData.map((admin: any) => ({
        ...admin,
        id: String(admin.id ?? admin.admin_id ?? admin.staff_id),
        name: admin.name || admin.full_name || admin.admin_name || 'Admin',
      }));
    }
    return DEFAULT_ADMINS;
  } catch (error) {
    return DEFAULT_ADMINS;
  }
};

export const syncStudentData = async (payload: {
  studentId: string | number;
  latitude: number;
  longitude: number;
  battery: number;
  status: string;
  timestamp?: string;
}) => {
  try {
    const response = await apiClient.post('/location/update', {
      student_id: Number(payload.studentId),
      latitude: payload.latitude,
      longitude: payload.longitude,
      sos_status: payload.status === 'Safe' ? 'safe' : 'help',
    });
    return response.data;
  } catch (error: any) {
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
      // Quiet fallback when offline / server unreachable
      return false;
    }
    console.error("❌ API Error: Location Sync Failed", error);
    return false;
  }
};

export const sendSOS = async (payload: {
  type: 'emergency' | 'safe' | 'help';
  location: any;
  studentId: string;
  battery?: number;
  signal?: string;
}) => {
  try {
    const response = await apiClient.post('/location/sos', {
      student_id: payload.studentId,
      sos_status: payload.type === 'safe' ? 'safe' : 'help',
      battery_level: payload.battery,
      signal: payload.signal
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: SOS Alert Failed", error);
    return null;
  }
};

export const uploadProfilePicture = async (studentId: string | number, imageUri: string) => {
  try {
    const uploadUrl = `${API_BASE_URL}/student/upload-profile-picture`;
    const uploadType = (FileSystem as any).FileSystemUploadType?.MULTIPART ?? (FileSystem as any).UploadType?.MULTIPART ?? 1;

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, imageUri, {
      httpMethod: 'POST',
      uploadType: uploadType,
      fieldName: 'profile_picture',
      parameters: {
        student_id: String(studentId),
      },
      headers: {
        'Accept': 'application/json',
      },
    });

    let responseData: any;
    try { responseData = JSON.parse(uploadResult.body); } catch { responseData = uploadResult.body; }

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return responseData;
    }
    return null;
  } catch (err) {
    console.error('❌ API Error: Profile picture upload failed', err);
    return null;
  }
};

export const uploadEmergencyVideo = async (payload: {
  videoUri: string;
  studentId: string;
  message?: string;
  latitude?: string | number;
  longitude?: string | number;
  battery_level?: string | number;
  signal?: string;
  isEmergency?: boolean; // true for SOS, false for student_message
}) => {
  const { videoUri, studentId, message, battery_level, signal, isEmergency = false } = payload;

  if (!videoUri) {
    console.error('❌ API Error: Video Upload Failed - missing video URI');
    return null;
  }

  const uploadUrl = `${API_BASE_URL}/notifications/send`;
  console.log('📹 Uploading emergency video via FileSystem to', uploadUrl, { videoUri, studentId, message });

  // Matches the current admin backend contract:
  // required: student_id, target, message
  // optional: battery_level, signal
  // latitude/longitude are intentionally excluded because the backend currently writes to a table
  // without those columns and fails with SQLSTATE[42S22].
  const parameters: Record<string, string> = {
    student_id: String(studentId),
    target: isEmergency ? 'sos' : 'student_message',
    message: message || 'Emergency - I Need Help',
  };

  if (battery_level !== undefined && battery_level !== null) parameters.battery_level = String(battery_level);
  if (signal) parameters.signal = String(signal);

  try {
    const uploadType = (FileSystem as any).FileSystemUploadType?.MULTIPART ?? (FileSystem as any).UploadType?.MULTIPART ?? 1;

    // FileSystem.uploadAsync performs native multipart upload, bypassing JS thread FormDataPart errors
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, videoUri, {
      httpMethod: 'POST',
      uploadType: uploadType,
      fieldName: 'video',
      mimeType: 'video/mp4',
      parameters,
      headers: {
        'Accept': 'application/json',
      },
    });

    let responseData: any;
    try {
      responseData = JSON.parse(uploadResult.body);
    } catch {
      responseData = uploadResult.body;
    }

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      console.log('✅ Video uploaded successfully via FileSystem:', responseData);
      return responseData || { success: true };
    }

    console.error('❌ Video upload server error:', uploadResult.status, responseData);
    return null;
  } catch (fsError: any) {
    console.error('❌ Video upload failed: backend unreachable or invalid upload URL.', {
      uploadUrl,
      apiBaseUrl: API_BASE_URL,
      message: fsError?.message || String(fsError),
    });
    return null;
  }
};

//Start for the admin api calls and function

export const sendBlackoutAlert = async (payload: {
  studentId: string;
  battery: number;
  signal?: string;
  message?: string;
}) => {
  try {
    const response = await apiClient.post('/notifications/send', {
      student_id: payload.studentId,
      target: 'blackout',
      message: payload.message || 'Blackout Alert',
      battery_level: payload.battery,
      signal: payload.signal
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Blackout Alert Failed", error);
    return null;
  }
};

export const sendAnnouncement = async (payload: {
  message: string;
  title?: string;
  targetClass: 'all' | '2026' | '2027' | '2028';
  adminId?: string | number;
  adminName?: string;
}) => {
  try {
    console.log('📢 [sendAnnouncement] Sending with payload:', {
      target: payload.targetClass,
      subject: payload.title || 'Announcement',
      message: payload.message,
      admin_name: payload.adminName || 'Admin'
    });

    const requestPayload = {
      target: payload.targetClass,
      subject: payload.title || 'Announcement',
      message: payload.message,
      admin_name: payload.adminName || 'Admin'
    };

    const response = await apiClient.post('/admin/broadcast', requestPayload);
    
    console.log('✅ [sendAnnouncement] Response status:', response.status);
    console.log('✅ [sendAnnouncement] Response data:', response.data);
    
    if (response.status === 200 || response.status === 201 || response.data) {
      const resultData = response.data?.data || response.data?.notification || response.data;
      console.log('✅ Announcement sent successfully:', resultData);

      // Save the sent broadcast locally to AsyncStorage so it immediately displays on the admin screen
      try {
        const localBroadcastsRaw = await AsyncStorage.getItem('gtrack_sent_broadcasts');
        const localBroadcasts = localBroadcastsRaw ? JSON.parse(localBroadcastsRaw) : [];
        const newBroadcast = {
          id: String(resultData?.id || Math.random()),
          title: payload.title || 'Announcement',
          message: payload.message,
          sentBy: payload.adminName || 'Admin',
          sentByAdminId: payload.adminId || 1,
          timestamp: new Date().toISOString(),
          targetClass: payload.targetClass,
          targetClasses: payload.targetClass === 'all' ? ['All'] : [payload.targetClass],
          status: 'outbound',
          type: 'broadcast',
        };
        localBroadcasts.unshift(newBroadcast);
        await AsyncStorage.setItem('gtrack_sent_broadcasts', JSON.stringify(localBroadcasts));
        console.log('💾 Broadcast saved locally in AsyncStorage');
      } catch (storageErr) {
        console.warn('⚠️ Failed to save broadcast locally:', storageErr);
      }

      return resultData || response.data;
    }
    
    return response.data;
  } catch (error: any) {
    console.error("❌ API Error: Sending Announcement Failed, simulating success offline", error);
    // Simulate successful creation and add to local mock broadcasts
    const newBroadcast = {
      id: Math.random().toString(),
      title: payload.title || 'Announcement',
      message: payload.message,
      sentBy: payload.adminName || 'Admin',
      sentByAdminId: payload.adminId || 1,
      timestamp: new Date().toISOString(),
      targetClass: payload.targetClass,
      targetClasses: payload.targetClass === 'all' ? ['All'] : [payload.targetClass],
      status: 'outbound' as const,
      type: 'broadcast' as const,
    };
    MOCK_BROADCASTS.unshift(newBroadcast); // Add to beginning
    return newBroadcast;
  }
};

export const sendStudentMessage = async (studentId: string | number, message: string, adminId?: string) => {
  try {
    const payload: any = {
      student_id: studentId,
      target: 'student_message',
      message,
    };
    if (adminId) payload.admin_id = adminId;

    const response = await apiClient.post('/notifications/send', payload);
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Sending Student Message Failed", error);
    return null;
  }
};

export const updatePushToken = async (studentId: string | number, token: string) => {
  try {
    const response = await apiClient.post('/update-push-token', {
      student_id: studentId,
      push_token: token
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Token Update Failed", error);
    return null;
  }
};

export const getStudentNotifications = async (studentId: string | number) => {
  try {
    const response = await apiClient.get(`/notifications/${studentId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`ℹ️ [getStudentNotifications] Notifications for student ${studentId} not found (404)`);
    } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
      // Quiet fallback when offline / server unreachable
      return [];
    } else {
      console.error("❌ API Error: Fetch Student Notifications Failed", error.message || error);
    }
    return [];
  }
};

// Chat messaging endpoints
export const getChatMessages = async (studentId: string | number): Promise<ChatMessage[]> => {
  try {
    const response = await apiClient.get(`/notifications/${studentId}`);
    
    let notifications = response.data?.notifications || response.data || [];
    
    // Filter to ensure 1-to-1 conversation: only include messages from this specific student
    // or messages to this specific student. This prevents message broadcasting.
    notifications = notifications.filter((msg: any) => {
      const msgStudentId = msg.student_id || msg.studentId;
      // Ensure this notification belongs to the selected student only
      return String(msgStudentId) === String(studentId);
    });
    
    // Transform API response to chat format
    const chatMessages = notifications.map((msg: any) => {
      const adminId = msg.admin_id || msg.adminId || msg.admin?.id;
      const sender = msg.sender_type === 'admin' ? 'admin' : 'student';
      return {
        id: msg.id || msg.message_id,
        sender: sender,
        text: msg.message || msg.text,
        timestamp: msg.created_at || msg.timestamp,
        senderName: msg.sender_name || (msg.sender_type === 'admin' ? 'Admin' : 'Student'),
        adminId: adminId, // Include adminId for accurate sender tracking
      } as ChatMessage;
    }).sort((a: ChatMessage, b: ChatMessage) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return chatMessages;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`ℹ️ [getChatMessages] Conversation thread for student ${studentId} not found (404), using mock fallback`);
    } else {
      console.error("❌ API Error: Fetch Chat Messages Failed, using mock fallback", error.message || error);
    }
    return MOCK_CHAT_MESSAGES[String(studentId)] || [
      { id: "m-default", sender: "student", text: "No recent conversation. Send a message to start.", timestamp: new Date().toISOString(), senderName: "Student" }
    ];
  }
};

export const sendChatMessage = async (
  studentId: string | number,
  message: string,
  adminId?: string,
  adminName?: string
): Promise<ChatMessage | null> => {
  try {
    const payload = {
      message: message,
      admin_id: adminId ? Number(adminId) : 1,
      admin_name: adminName || 'Admin'
    };

    console.log('📤 Sending message to backend with payload:', payload);
    const response = await apiClient.post(`/admin/message/send/${studentId}`, payload);
    
    const responseAdminId = response.data.admin_id || response.data.adminId || adminId;
    const chatMessage: ChatMessage = {
      id: response.data.id || response.data.message_id || Math.random().toString(),
      sender: 'admin' as const,
      text: message,
      timestamp: response.data.created_at || new Date().toISOString(),
      senderName: response.data.admin_name || adminName || 'Admin',
      adminId: responseAdminId,
    };
    return chatMessage;
  } catch (error: any) {
    console.error("❌ API Error: Send Chat Message Failed, simulating success offline", error);
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'admin' as const,
      text: message,
      timestamp: new Date().toISOString(),
      senderName: adminName || 'Admin',
      adminId: adminId || "1",
    };
    if (!MOCK_CHAT_MESSAGES[String(studentId)]) {
      MOCK_CHAT_MESSAGES[String(studentId)] = [];
    }
    MOCK_CHAT_MESSAGES[String(studentId)].push(newMsg);
    return newMsg;
  }
};

// SOS Alerts - Fetch emergency SOS alerts sent by students (via video uploads)
export const getSosAlerts = async (): Promise<SOSAlertVideo[]> => {
  try {
    // console.log('🚨 [getSosAlerts] Fetching from /location/all');
    const response = await apiClient.get('/location/all');
    const locations = response.data || [];
    // console.log('🚨 [getSosAlerts] Got locations:', locations.length);
    
    // Filter for SOS status 'help' (student triggered I need help)
    const sosLocations = locations.filter((loc: any) => loc.sos_status === 'help');
    // console.log('🚨 [getSosAlerts] Filtered SOS locations count:', sosLocations.length);
    
    // For each active SOS location, fetch notifications to retrieve the video URL and actual notification ID
    const result = await Promise.all(
      sosLocations.map(async (loc: any) => {
        const studentDbId = loc.student?.id || loc.student_id;
        let videoUrl = '';
        let message = loc.message || 'SOS Alert Triggered';
        let notificationId = loc.id; // fallback to location ID
        let sosNotif: any = null;

        if (studentDbId) {
          try {
            // console.log(`🚨 [getSosAlerts] Fetching notifications for student DB ID: ${studentDbId}`);
            const notifResponse = await apiClient.get(`/notifications/${studentDbId}`);
            const notifications = notifResponse.data?.notifications || notifResponse.data || [];
            
            // Find the notification with type 'sos' or containing a video_url or media_url (not audio)
            sosNotif = notifications.find(
              (notif: any) =>
                notif.type === 'sos' ||
                notif.video_url ||
                notif.video_path ||
                notif.video ||
                (notif.media_url && !notif.media_url.match(/\.(mp3|wav)$/i)) ||
                (notif.mediaUrl && !notif.mediaUrl.match(/\.(mp3|wav)$/i))
            );

            if (sosNotif) {
              // console.log(`🚨 [getSosAlerts] Found SOS video notification for student ${studentDbId}:`, sosNotif.id);
              videoUrl = sosNotif.video_url || sosNotif.video_path || sosNotif.video || 
                (sosNotif.media_url && !sosNotif.media_url.match(/\.(mp3|wav)$/i) ? sosNotif.media_url : '') ||
                (sosNotif.mediaUrl && !sosNotif.mediaUrl.match(/\.(mp3|wav)$/i) ? sosNotif.mediaUrl : '') || '';
              message = sosNotif.message || message;
              notificationId = sosNotif.id; // use actual notification ID for resolution actions!
            }
          } catch (notifErr: any) {
            console.warn(`🚨 [getSosAlerts] Failed to fetch notifications for student ${studentDbId}:`, notifErr.message || notifErr);
          }
        }

        return {
          id: String(notificationId),
          studentId: loc.student?.id || loc.student_id || 'N/A',
          studentName: loc.student?.name || 'Unknown Student',
          videoUrl: videoUrl,
          latitude: parseFloat(loc.latitude) || 0,
          longitude: parseFloat(loc.longitude) || 0,
          battery: loc.battery_level || loc.battery || (sosNotif ? (sosNotif.battery_level || sosNotif.battery) : 0),
          signal: loc.signal_status || loc.signal || (sosNotif ? (sosNotif.signal_status || sosNotif.signal) : 'Unknown'),
          timestamp: loc.recorded_at || loc.created_at || new Date().toISOString(),
          message: message,
        };
      })
    );

    // console.log('🚨 [getSosAlerts] Returning', result.length, 'SOS alerts with resolved video URLs');
    return result;
  } catch (error: any) {
    console.error("🚨 [getSosAlerts] API Error, using mock fallback", error.message || error);
    return MOCK_LOCATIONS
      .filter((loc: any) => loc.sos_status === 'help')
      .map((loc: any) => ({
        id: String(loc.id),
        studentId: loc.student?.id || loc.student_id || 'N/A',
        studentName: loc.student?.name || 'Unknown Student',
        videoUrl: '',
        latitude: parseFloat(loc.latitude as any) || 0,
        longitude: parseFloat(loc.longitude as any) || 0,
        battery: loc.battery_level || 0,
        signal: loc.signal || loc.wifi_status || 'Unknown',
        timestamp: loc.recorded_at || loc.created_at || new Date().toISOString(),
        message: loc.message || 'SOS Alert Triggered',
      })) as any;
  }
};

// Blackout Alerts - Fetch power outage reports
export const getBlackoutAlerts = async (): Promise<BlackoutAlert[]> => {
  try {
    console.log('⚠️ [getBlackoutAlerts] Attempting to fetch blackout alerts');
    
    // Try /notifications endpoint with query parameter
    try {
      const response = await apiClient.get('/notifications', {
        params: { type: 'blackout' }
      });
      const notifications = response.data?.data || response.data?.notifications || response.data || [];
      console.log('⚠️ [getBlackoutAlerts] Got from /notifications:', notifications.length);
      
      const blackoutAlerts = notifications.filter((notif: any) => 
        notif.target === 'blackout' || notif.type === 'blackout'
      );
      
      if (blackoutAlerts.length > 0) {
        return blackoutAlerts.map((notif: any) => ({
          id: String(notif.id),
          studentId: notif.student_id || notif.student?.id,
          studentName: notif.student?.name || notif.student_name || 'Unknown Student',
          battery: notif.battery_level || notif.battery || 0,
          signal: notif.signal_status || notif.signal || notif.wifi_status || 'Unknown',
          latitude: parseFloat(notif.latitude) || 0,
          longitude: parseFloat(notif.longitude) || 0,
          timestamp: notif.created_at || notif.timestamp || new Date().toISOString(),
          message: notif.message || 'Power Outage Alert',
          status: notif.status || 'new',
        }));
      }
    } catch (error) {
      console.log('⚠️ [getBlackoutAlerts] /notifications endpoint failed');
    }
    
    // Fallback: try /blackout-alerts endpoint
    try {
      const response = await apiClient.get('/blackout-alerts');
      const blackoutAlerts = response.data?.data || response.data || [];
      console.log('⚠️ [getBlackoutAlerts] Got from /blackout-alerts:', blackoutAlerts.length);
      
      if (blackoutAlerts.length > 0) {
        return blackoutAlerts.map((alert: any) => ({
          id: String(alert.id),
          studentId: alert.student_id || alert.student?.id,
          studentName: alert.student?.name || 'Unknown Student',
          battery: alert.battery_level || alert.battery || 0,
          signal: alert.signal_status || alert.signal || 'Unknown',
          latitude: parseFloat(alert.latitude) || 0,
          longitude: parseFloat(alert.longitude) || 0,
          timestamp: alert.created_at || new Date().toISOString(),
          message: alert.message || 'Power Outage Alert',
          status: alert.status || 'new',
        }));
      }
    } catch (error) {
      console.log('⚠️ [getBlackoutAlerts] /blackout-alerts endpoint not available');
    }
    
    console.log('⚠️ [getBlackoutAlerts] No blackout alerts endpoints available, returning empty');
    return [];
  } catch (error) {
    console.error("⚠️ [getBlackoutAlerts] API Error:", error);
    return [];
  }
};

// Update blackout alert status (acknowledge or resolve)
export const updateBlackoutAlertStatus = async (
  alertId: string | number,
  status: 'acknowledged' | 'resolved'
): Promise<any> => {
  try {
    const response = await apiClient.put(`/notifications/${alertId}`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Update Blackout Alert Status Failed", error);
    return null;
  }
};

// Broadcast Notifications - Fetch all broadcast notifications sent by admins
export const getBroadcastNotifications = async (): Promise<any[]> => {
  let localBroadcasts: any[] = [];
  try {
    const localBroadcastsRaw = await AsyncStorage.getItem('gtrack_sent_broadcasts');
    if (localBroadcastsRaw) {
      localBroadcasts = JSON.parse(localBroadcastsRaw);
      console.log('📢 Loaded local broadcasts from storage:', localBroadcasts.length);
    }
  } catch (storageErr) {
    console.warn('⚠️ Failed to load local broadcasts:', storageErr);
  }

  try {
    console.log('📢 [getBroadcastNotifications] Fetching broadcast notifications');
    
    // Try to fetch all notifications and filter for broadcasts
    const response = await apiClient.get('/notifications');
    const notifications = response.data?.data || response.data?.notifications || response.data || [];
    console.log('📢 [getBroadcastNotifications] Got notifications:', notifications.length);
    
    // Filter for broadcast type notifications (sent to all or specific classes)
    const broadcastNotifications = notifications.filter((notif: any) => 
      notif.type === 'broadcast' || 
      notif.target === 'all' || 
      notif.target === '2026' || 
      notif.target === '2027' || 
      notif.target === '2028' ||
      (notif.sender_type === 'admin' && (notif.target_all === true || notif.target_class || notif.target))
    );
    
    console.log('📢 [getBroadcastNotifications] Filtered broadcasts:', broadcastNotifications.length);
    
    // Transform to BroadcastNotification format
    const broadcasts = broadcastNotifications.map((notif: any) => ({
      id: String(notif.id),
      title: notif.title || notif.subject || 'Announcement',
      message: notif.message || notif.content || '',
      sentBy: notif.sent_by || notif.admin?.name || notif.admin_name || 'Admin',
      sentByAdminId: notif.admin_id || notif.adminId || notif.admin?.id,
      timestamp: notif.created_at || notif.timestamp || new Date().toISOString(),
      targetClass: notif.target_class || notif.class || notif.target,
      targetClasses: notif.target_classes || (notif.target === 'all' ? ['All'] : [notif.target || 'All']),
      status: 'outbound' as const,
      type: 'broadcast' as const,
    }));
    
    // Merge with local broadcasts, avoiding duplicates by id
    const merged = [...localBroadcasts];
    broadcasts.forEach((b: any) => {
      if (!merged.some((item: any) => String(item.id) === String(b.id))) {
        merged.push(b);
      }
    });

    // Sort by timestamp (newest first)
    merged.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    console.log('📢 [getBroadcastNotifications] Returning', merged.length, 'broadcasts');
    return merged;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log("ℹ️ [getBroadcastNotifications] /notifications endpoint not found on server (404), using local + mock fallback");
    } else {
      console.error("❌ API Error: Fetch Broadcast Notifications Failed, using mock fallback", error.message || error);
    }

    // Merge local broadcasts with mock broadcasts
    const merged = [...localBroadcasts];
    MOCK_BROADCASTS.forEach((b: any) => {
      if (!merged.some((item: any) => String(item.id) === String(b.id))) {
        merged.push(b);
      }
    });

    // Sort by timestamp (newest first)
    merged.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return merged;
  }
};

// Resolve SOS/Blackout Alert (Admin -> Student status reset)
export const resolveSOSAlert = async (notificationId: string | number): Promise<any> => {
  try {
    console.log(`🚨 [resolveSOSAlert] Resolving notification: ${notificationId}`);
    const response = await apiClient.post(`/admin/notification/resolve/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Resolve SOS Alert Failed", error);
    return null;
  }
};

// Fetch Dashboard Stats (Admin Dashboard counter & map sync)
export const getDashboardStats = async () => {
  try {
    // console.log('📊 [getDashboardStats] Fetching dashboard stats');
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Dashboard Stats Failed", error);
    return null;
  }
};

