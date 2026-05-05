import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Network';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const getStudents = async () => {
  try {
    const response = await apiClient.get('/status/all');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Students Failed", error);
    return []; 
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
    console.error("❌ API Error: Fetch Alerts Failed", error);
    return [];
  }
};

export const getRecentLocations = async () => {
  try {
    const response = await apiClient.get('/location/all');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Locations Failed", error);
    return [];
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
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for large files (20MB)

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

      if (response.status === 422) {
        console.error('❌ API Error: Validation Error (file too large or missing required field)', responseData);
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
  targetClass: 'all' | '2026' | '2027' | '2028';
}) => {
  try {
    const response = await apiClient.post('/notifications/send', {
      target: payload.targetClass,
      message: payload.message
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Sending Announcement Failed", error);
    return null;
  }
};

export const sendStudentMessage = async (studentId: string | number, message: string) => {
  try {
    const response = await apiClient.post('/notifications/send', {
      student_id: studentId,
      target: 'student_message',
      message,
    });
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