
/**
 * G!Track API SERVICE (Test Mode)
 * Replace OFFLINE_TEST_MODE with your Laravel IP later (e.g., http://192.168.1.XX:8000/api)
 */
const API_URL = 'http://OFFLINE_TEST_MODE'; 

/**
 * 1. CONTINUOUS LOCATION SYNC (15-Minute Timeline)
 * This is called by both useLocation.ts (Foreground) 
 * and _layout.tsx TaskManager (Background).
 */
export const syncStudentData = async (payload: {
  studentId: string;
  latitude: number;
  longitude: number;
  battery: number;
  status: string;
  timestamp: string;
}) => {
  // LOGGING FOR PERFORMANCED VERIFICATION IN VS CODE TERMINAL
  console.log("🛠️ [API] 15-min Sync Data Captured:", payload);
  
  // We simulate a successful server response for development
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ [API] Sync Success for Student: ${payload.studentId}`);
      resolve(true); 
    }, 1000);
  });

  /* // ONCE LARAVEL IS READY, UNCOMMENT THIS:
  try {
    const response = await axios.post(`${API_URL}/location-updates`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Laravel Sync Error:", error);
    return false;
  }
  */
};

/**
 * 2. SMART SOS ALERT
 * Instant notification for the Admin OpenStreetMap.
 */
export const sendSOS = async (payload: {
  type: 'emergency' | 'safe' | 'help';
  location: any;
  studentId: string;
}) => {
  console.log("🚨 [API] SOS Signal Triggered!", payload);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ [API] SOS Received by Admin Dashboard (Simulated)");
      resolve({ status: 'success' });
    }, 500);
  });

  /* // ONCE LARAVEL IS READY, UNCOMMENT THIS:
  try {
    const response = await axios.post(`${API_URL}/sos-alert`, payload);
    return response.data;
  } catch (error) {
    return null;
  }
  */
};

/**
 * 3. EMERGENCY VIDEO UPLOAD
 * Fulfills the "Live Audio/Video Feed" Requirement.
 */
export const uploadEmergencyVideo = async (videoUri: string, studentId: string) => {
  console.log(`📹 [API] Uploading video for ${studentId} from ${videoUri}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ [API] Video Upload Complete (Simulated)");
      resolve({ status: 'uploaded' });
    }, 2000);
  });

  /* // ONCE LARAVEL IS READY, UNCOMMENT THIS:
  try {
    const formData = new FormData();
    // @ts-ignore
    formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'sos.mp4' });
    formData.append('student_id', studentId);
    const response = await axios.post(`${API_URL}/upload-video`, formData);
    return response.data;
  } catch (error) {
    return null;
  }
  */
};