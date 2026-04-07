import * as Battery from 'expo-battery';
import { Stack } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncStudentData } from '../../services/api';

const LOCATION_TASK_NAME = 'background-location-task';
const FIFTEEN_MINUTES = 15 * 60 * 1000;
let lastSyncTime = 0; // Simple in-memory throttle for the session

// --- BACKGROUND WORKER ---
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Background Location Error:", error);
    return;
  }
  if (data) {
    try {
      const now = Date.now();
      // Throttle to 15 minutes
      if (now - lastSyncTime < FIFTEEN_MINUTES) return;

      const role = await AsyncStorage.getItem('userRole');
      if (role !== 'student') return;

      const studentId = await AsyncStorage.getItem('studentId');
      if (!studentId) return;

      const { locations } = data;
      const location = locations[0];
      
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);

      await syncStudentData({
        studentId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        battery: batteryPercent, 
        status: "Active",
        timestamp: new Date().toISOString()
      });

      lastSyncTime = now;
    } catch (err) {
      console.error("Background Sync Task Failed:", err);
    }
  }
});

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login Screen comes first */}
      <Stack.Screen name="index" /> 
      {/* Tab Group follows after login */}
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      {/* Admin Tab Group */}
      <Stack.Screen name="(adminTabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}