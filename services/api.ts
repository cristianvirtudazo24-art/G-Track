import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Network';

// Configuring default axios instance for the app
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * 1. FETCH ALL STUDENTS (For Admin Dashboard)
 */
export const getStudents = async () => {
  try {
    const response = await apiClient.get('/students');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Students Failed", error);
    return []; 
  }
};

/**
 * 2. FETCH ALL ALERTS (For Admin Dashboard)
 */
export const getAlerts = async () => {
  try {
    const response = await apiClient.get('/alerts');
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Fetch Alerts Failed", error);
    return [];
  }
};

/**
 * 3. CONTINUOUS LOCATION SYNC
 */
export const syncStudentData = async (payload: {
  studentId: string;
  latitude: number;
  longitude: number;
  battery: number;
  status: string;
  timestamp: string;
}) => {
  try {
    const response = await apiClient.post('/location-updates', payload);
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Location Sync Failed", error);
    return false;
  }
};

/**
 * 4. SMART SOS ALERT
 */
export const sendSOS = async (payload: {
  type: 'emergency' | 'safe' | 'help';
  location: any;
  studentId: string;
}) => {
  try {
    const response = await apiClient.post('/sos-alert', payload);
    return response.data;
  } catch (error) {
    console.error("❌ API Error: SOS Alert Failed", error);
    return null;
  }
};

/**
 * 5. EMERGENCY VIDEO UPLOAD
 */
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

/**
 * 6. BLACKOUT ALERT
 */
export const sendBlackoutAlert = async (payload: {
  studentId: string;
  battery: number;
  message?: string;
}) => {
  try {
    const response = await apiClient.post('/blackout-alert', payload);
    return response.data;
  } catch (error) {
    console.error("❌ API Error: Blackout Alert Failed", error);
    return null;
  }
};