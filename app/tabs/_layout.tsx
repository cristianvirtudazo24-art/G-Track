import { Stack } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import { syncStudentData } from '../../services/api';

const LOCATION_TASK_NAME = 'background-location-task';

// --- BACKGROUND WORKER ---
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Background Location Error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    await syncStudentData({
      studentId: "kefnbjhf",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      battery: 100, 
      status: "Active",
      timestamp: new Date().toISOString()
    });
  }
});

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login Screen comes first */}
      <Stack.Screen name="index" /> 
      {/* Tab Group follows after login */}
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}