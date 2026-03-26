
// 1. Leave this empty for now since you don't have the IP
const API_URL = 'http://OFFLINE_TEST_MODE'; 

/**
 * MOCKED: 15-Minute Sync
 */
export const syncStudentData = async (payload: any) => {
  console.log("🛠️ TEST MODE: 15-min Sync Data captured locally:", payload);
  
  // We simulate a successful server response after 1 second
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ TEST MODE: Sync Success (Simulated)");
      resolve(true); 
    }, 1000);
  });
};

/**
 * MOCKED: SOS Alert
 */
export const sendSOS = async (payload: any) => {
  console.log("🚨 TEST MODE: SOS Signal Triggered!", payload);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ TEST MODE: SOS Received by 'Admin' (Simulated)");
      resolve({ status: 'success' });
    }, 500);
  });
};

/**
 * MOCKED: Video Upload
 */
export const uploadEmergencyVideo = async (videoUri: string, studentId: string) => {
  console.log(`📹 TEST MODE: Uploading video for ${studentId} from ${videoUri}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ TEST MODE: Video Upload Complete (Simulated)");
      resolve({ status: 'uploaded' });
    }, 2000);
  });
};