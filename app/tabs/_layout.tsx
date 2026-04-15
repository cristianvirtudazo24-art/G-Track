import * as Battery from 'expo-battery';
import { Stack } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { syncStudentData, updatePushToken } from '../../services/api';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../../services/notifications';
import { AnnouncementModal } from '../../components/AnnouncementModal';

const LOCATION_TASK_NAME = 'background-location-task';
const FIFTEEN_MINUTES = 15 * 60 * 1000;
let lastSyncTime = 0;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Background Location Error:", error);
    return;
  }
  if (data) {
    try {
      const now = Date.now();
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
  const [announcement, setAnnouncement] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      const studentId = await AsyncStorage.getItem('studentId');
      if (!studentId) return;

      const token = await registerForPushNotificationsAsync();
      if (token && isMounted) {
        await updatePushToken(studentId, token);
      }
    };

    initializeNotifications();

    const cleanup = setupNotificationListeners(
      (notification) => {
        const { title, body } = notification.request.content;
        if (isMounted) {
          setAnnouncement({ title: title ?? 'Announcement', body: body ?? '' });
          import('react-native').then(({ DeviceEventEmitter }) => {
            DeviceEventEmitter.emit('refreshAlerts');
          });
        }
      },
      (response) => {
        const { title, body } = response.notification.request.content;
        if (isMounted) {
          setAnnouncement({ title: title ?? 'Announcement', body: body ?? '' });
          import('react-native').then(({ DeviceEventEmitter }) => {
            DeviceEventEmitter.emit('refreshAlerts');
          });
        }
      }
    );

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" /> 
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(adminTabs)" options={{ animation: 'fade' }} />
      </Stack>

      <AnnouncementModal
        visible={!!announcement}
        title={announcement?.title ?? ''}
        message={announcement?.body ?? ''}
        onClose={() => setAnnouncement(null)}
      />
    </>
  );
}