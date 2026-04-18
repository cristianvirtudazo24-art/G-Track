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

export const syncStudentData = async (payload: {
  studentId: string | number;
  latitude: number;
  longitude: number;
  battery: number;
  status: string;
  timestamp?: string;
}) => {
  try {
    const requestBody = {
      student_id: Number(payload.studentId),
      latitude: payload.latitude,
      longitude: payload.longitude,
      sos_status: (payload.status === 'Safe' || payload.status === 'Active') ? 'safe' : 'help',
    };
    console.log("📡 Outgoing Location Sync:", requestBody);
    const response = await apiClient.post('/location/update', requestBody);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      console.error("❌ API Error: Location Sync Failed (Validation):", error.response.data);
    } else {
      console.error("❌ API Error: Location Sync Failed", error);
    }
    return false;
  }
};

export const sendSOS = async (payload: {
  type: 'emergency' | 'safe' | 'help';
  location: any;
  studentId: string | number;
}) => {
  try {
    const response = await apiClient.post('/location/sos', {
      student_id: Number(payload.studentId),
      sos_status: payload.type === 'safe' ? 'safe' : 'help'
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: SOS Alert Failed", error);
    return null;
  }
};

export const uploadEmergencyVideo = async (videoUri: string, studentId: string) => {
  try {
    const formData = new FormData();
    // @ts-ignore
    formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'sos.mp4' });
    formData.append('student_id', studentId);
    const response = await apiClient.post('/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Video Upload Failed", error);
    return null;
  }
};

export const sendBlackoutAlert = async (payload: {
  studentId: string | number;
  battery: number;
  message?: string;
}) => {
  try {
    const response = await apiClient.post('/notifications/send', {
      student_id: Number(payload.studentId),
      target: 'blackout',
      message: payload.message || 'Blackout Alert'
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
    return { notifications: [] };
  }
};

export const sendStudentMessage = async (studentId: string | number, message: string) => {
  try {
    const requestBody = {
      student_id: Number(studentId),
      target: 'student_message',
      message: message
    };
    console.log("📡 Outgoing Student Message:", requestBody);
    const response = await apiClient.post('/notifications/send', requestBody);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      console.error("❌ API Error: Send Message Failed (Validation):", error.response.data);
    } else {
      console.error("❌ API Error: Send Message Failed", error);
    }
    return null;
  }
};