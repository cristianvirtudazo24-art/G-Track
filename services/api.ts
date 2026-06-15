import axios from 'axios';
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

export const getAdmins = async () => {
  try {
    const response = await apiClient.get('/admins');
    return response.data?.admins || response.data || [];
  } catch (error) {
    console.error("❌ API Error: Fetch Admin List Failed", error);
    return [];
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
  } catch (error) {
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
  const { videoUri, studentId, message, latitude, longitude, battery_level, signal, isEmergency = false } = payload;

  if (!videoUri) {
    console.error('❌ API Error: Video Upload Failed - missing video URI');
    return null;
  }

  try {
    const formData = new FormData();
    // @ts-ignore
    formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'sos.mp4' });
    formData.append('student_id', studentId);
    
    // Use correct target based on emergency type
    // Backend accepts: student_message (normal), sos (emergency), blackout
    formData.append('target', isEmergency ? 'sos' : 'student_message');
    
    // Message is REQUIRED by backend - use fallback if not provided
    formData.append('message', message || 'Video uploaded');
    
    if (latitude !== undefined && latitude !== null) formData.append('latitude', String(latitude));
    if (longitude !== undefined && longitude !== null) formData.append('longitude', String(longitude));
    if (battery_level !== undefined && battery_level !== null) formData.append('battery_level', String(battery_level));
    if (signal) formData.append('signal', signal);

    // Use /api/notifications/send for emergency video uploads (per admin spec - this creates the notification)
    const uploadUrl = `${API_BASE_URL}/notifications/send`;
    console.log('Uploading emergency video to', uploadUrl, { videoUri, studentId, message, latitude, longitude, battery_level, signal });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutMs = 180000; // 180 seconds timeout for larger uploads up to 50MB
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Handle specific error codes per admin spec
      if (response.status === 404) {
        console.error('❌ API Error: Invalid Student ID');
        return null;
      }

      if (response.status === 413) {
        console.error('❌ API Error: Payload Too Large (video exceeds server max upload size)', responseData);
        return null;
      }

      if (response.status === 422) {
        console.error('❌ API Error: Validation Error (file too large or missing required field)', responseData);
        return null;
      }

      if (response.status === 504) {
        console.error('❌ API Error: Upload timed out on the server side', responseData);
        return null;
      }

      if (!response.ok) {
        console.error('❌ API Error: Video Upload Failed', {
          status: response.status,
          body: responseData,
        });
        return null;
      }

      // Success response includes notification_id
      console.log('✅ Video uploaded successfully', responseData);
      return responseData;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    console.error('❌ API Error: Video Upload Failed', error.message || error);
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
}) => {
  try {
    console.log('📢 [sendAnnouncement] Sending with payload:', {
      target: payload.targetClass,
      message: payload.message,
      title: payload.title,
      admin_id: payload.adminId,
      type: 'broadcast'
    });

    const requestPayload: any = {
      target: payload.targetClass,
      message: payload.message,
      type: 'broadcast'
    };
    
    // Add optional fields if provided
    if (payload.title) {
      requestPayload.title = payload.title;
      requestPayload.subject = payload.title; // Try both keys
    }
    if (payload.adminId) {
      requestPayload.admin_id = payload.adminId;
    }

    const response = await apiClient.post('/notifications/send', requestPayload);
    
    console.log('✅ [sendAnnouncement] Response status:', response.status);
    console.log('✅ [sendAnnouncement] Response data:', response.data);
    
    if (response.status === 200 || response.status === 201 || response.data) {
      const resultData = response.data?.data || response.data?.notification || response.data;
      console.log('✅ Announcement sent successfully:', resultData);
      return resultData || response.data;
    }
    
    return response.data;
  } catch (error: any) {
    console.error("❌ API Error: Sending Announcement Failed, simulating success offline");
    // Simulate successful creation and add to local mock broadcasts
    const newBroadcast = {
      id: Math.random().toString(),
      title: payload.title || 'Announcement',
      message: payload.message,
      sentBy: 'Admin',
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
  } catch (error) {
    console.error("❌ API Error: Fetch Student Notifications Failed", error);
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
    console.error("❌ API Error: Fetch Chat Messages Failed, using mock fallback");
    return MOCK_CHAT_MESSAGES[String(studentId)] || [
      { id: "m-default", sender: "student", text: "No recent conversation. Send a message to start.", timestamp: new Date().toISOString(), senderName: "Student" }
    ];
  }
};

export const sendChatMessage = async (
  studentId: string | number,
  message: string,
  adminId?: string
): Promise<ChatMessage | null> => {
  try {
    const payload: any = {
      student_id: studentId,
      target: 'student_message',
      message: message,
    };
    if (adminId) payload.admin_id = adminId;

    console.log('📤 Sending message to backend with payload:', payload);
    const response = await apiClient.post(`/notifications/send`, payload);
    
    const responseAdminId = response.data.admin_id || response.data.adminId || adminId;
    const chatMessage: ChatMessage = {
      id: response.data.id || response.data.message_id || Math.random().toString(),
      sender: 'admin' as const,
      text: message,
      timestamp: response.data.created_at || new Date().toISOString(),
      senderName: 'Admin',
      adminId: responseAdminId,
    };
    return chatMessage;
  } catch (error: any) {
    console.error("❌ API Error: Send Chat Message Failed, simulating success offline");
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'admin' as const,
      text: message,
      timestamp: new Date().toISOString(),
      senderName: 'Admin',
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
    console.log('🚨 [getSosAlerts] Fetching from /location/all');
    const response = await apiClient.get('/location/all');
    const locations = response.data || [];
    console.log('🚨 [getSosAlerts] Got locations:', locations.length);
    
    // Filter for SOS status 'help' (student triggered I need help)
    const sosAlerts = locations.filter((loc: any) => loc.sos_status === 'help');
    console.log('🚨 [getSosAlerts] Filtered SOS alerts count:', sosAlerts.length);
    
    const result = sosAlerts.map((loc: any) => ({
      id: String(loc.id),
      studentId: loc.student?.id || loc.student_id || 'N/A',
      studentName: loc.student?.name || 'Unknown Student',
      videoUrl: loc.video_url || '',
      latitude: parseFloat(loc.latitude) || 0,
      longitude: parseFloat(loc.longitude) || 0,
      battery: loc.battery_level || 0,
      signal: loc.signal || loc.wifi_status || 'Unknown',
      timestamp: loc.recorded_at || loc.created_at || new Date().toISOString(),
      message: loc.message || 'SOS Alert Triggered',
    }));
    
    console.log('🚨 [getSosAlerts] Returning', result.length, 'SOS alerts');
    return result;
  } catch (error) {
    console.error("🚨 [getSosAlerts] API Error, using mock fallback", error);
    return MOCK_LOCATIONS
      .filter((loc: any) => loc.sos_status === 'help')
      .map((loc: any) => ({
        id: String(loc.id),
        studentId: loc.student?.id || loc.student_id || 'N/A',
        studentName: loc.student?.name || 'Unknown Student',
        videoUrl: loc.video_url || '',
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
          battery: notif.battery_level || 0,
          signal: notif.signal || notif.wifi_status || 'Unknown',
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
          battery: alert.battery_level || 0,
          signal: alert.signal || 'Unknown',
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
    
    // Sort by timestamp (newest first)
    broadcasts.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    console.log('📢 [getBroadcastNotifications] Returning', broadcasts.length, 'broadcasts');
    return broadcasts;
  } catch (error) {
    console.error("❌ API Error: Fetch Broadcast Notifications Failed, using mock fallback", error);
    return MOCK_BROADCASTS;
  }
};