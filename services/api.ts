
/**
 * G!Track API SERVICE (Test Mode)
 * Replace OFFLINE_TEST_MODE with your Laravel IP later (e.g., http://192.168.1.XX:8000/api)
 */
const API_URL = 'http://OFFLINE_TEST_MODE'; 

// IN-MEMORY STORE for Mock Live Tracking Connection
export let memoryStudents = [
  { id: '1', name: 'John Doe (Active User)', gender: 'male', latitude: 10.2952207, longitude: 123.8955044, status: 'Active' },
  { id: '2', name: 'Jane Smith', gender: 'female', latitude: 10.2962207, longitude: 123.8965044, status: 'Safe' },
  { id: '3', name: 'Mark E.', gender: 'male', latitude: 10.2932207, longitude: 123.8935044, status: 'Active' },
  { id: '4', name: 'Sarah W.', gender: 'female', latitude: 10.2972207, longitude: 123.8985044, status: 'Emergency' },
];

export let memoryAlerts: any[] = [
  { id: '101', type: 'warning', text: 'System initialized. Maps online.', timestamp: new Date().toISOString() }
];

export const getStudents = async () => {
  return memoryStudents;
};

export const getAlerts = async () => {
  return memoryAlerts;
};

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
  // LOGGING FOR VERIFICATION IN VS CODE TERMINAL
  console.log("🛠️ [API] Sync Update Received:", payload.latitude, payload.longitude);

  const idx = memoryStudents.findIndex(s => s.id === payload.studentId);
  if (idx !== -1) {
    memoryStudents[idx].latitude = payload.latitude;
    memoryStudents[idx].longitude = payload.longitude;
    memoryStudents[idx].status = payload.status;
  } else {
    memoryStudents.push({
      id: payload.studentId,
      name: 'New Connection',
      gender: 'male',
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: payload.status
    });
  }
  
  // We simulate a successful server response for development
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true); 
    }, 200);
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
  
  // Update student status if found
  const student = memoryStudents.find(s => s.id === payload.studentId);
  const studentName = student ? student.name : 'A student';
  if (student) {
    student.status = payload.type === 'safe' ? 'Safe' : 'Emergency';
  }

  // Push to alerts
  memoryAlerts.unshift({
    id: Date.now().toString(),
    type: payload.type === 'safe' ? 'info' : 'danger',
    text: `${studentName} sent an SOS: ${payload.type.toUpperCase()}`,
    timestamp: new Date().toISOString()
  });
  
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
  
  const student = memoryStudents.find(s => s.id === studentId);
  const studentName = student ? student.name : 'A student';

  // Push to alerts
  memoryAlerts.unshift({
    id: Date.now().toString(),
    type: 'info',
    text: `${studentName} uploaded an emergency video payload.`,
    timestamp: new Date().toISOString()
  });

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

/**
 * 4. BLACKOUT ALERT
 * Notify admin of power loss, sending battery level and an optional message.
 */
export const sendBlackoutAlert = async (payload: {
  studentId: string;
  battery: number;
  message?: string;
}) => {
  console.log("🔌 [API] Blackout Alert Triggered!", payload);
  
  const student = memoryStudents.find(s => s.id === payload.studentId);
  const studentName = student ? student.name : 'A student';
  const customMessage = payload.message ? `\nMessage: "${payload.message}"` : '';

  // Push to alerts
  memoryAlerts.unshift({
    id: Date.now().toString(),
    type: 'warning',
    text: `${studentName} triggered Blackout Alert (Battery: ${payload.battery}%)${customMessage}`,
    timestamp: new Date().toISOString()
  });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ [API] Blackout Alert Received by Admin Dashboard (Simulated)");
      resolve({ status: 'success' });
    }, 500);
  });

  /* // ONCE LARAVEL IS READY, UNCOMMENT THIS:
  try {
    const response = await axios.post(`${API_URL}/blackout-alert`, payload);
    return response.data;
  } catch (error) {
    return null;
  }
  */
};