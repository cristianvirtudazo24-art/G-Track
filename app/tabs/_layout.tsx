import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import { Stack } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect, useRef, useState } from 'react';
import { AnnouncementModal } from '../../components/AnnouncementModal';
import { getStudentNotifications, syncStudentData, updatePushToken } from '../../services/api';
import { registerForPushNotificationsAsync, scheduleLocalNotification, setupNotificationListeners } from '../../services/notifications';
import { parseBroadcastMessage } from '../../utils/helpers';

const LOCATION_TASK_NAME = 'background-location-task';
const FIFTEEN_MINUTES = 15 * 60 * 1000;
let lastSyncTime = 0;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  if (data) {
    try {
      const now = Date.now();
      if (now - lastSyncTime < FIFTEEN_MINUTES) return;
      const role = await AsyncStorage.getItem('userRole');
      if (role !== 'student') return;
      const dbId = await AsyncStorage.getItem('userDbId');
      if (!dbId) return;
      const { locations } = data;
      const location = locations[0];
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);
      await syncStudentData({
        studentId: dbId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        battery: batteryPercent,
        status: "Safe",
        timestamp: new Date().toISOString()
      });
      lastSyncTime = now;
    } catch (err) {}
  }
});

type AnnouncementPayload = {
  title: string;
  subject?: string;
  body: string;
};

export default function RootLayout() {
  const [announcement, setAnnouncement] = useState<AnnouncementPayload | null>(null);
  const lastSeenIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initializeNotifications = async () => {
      const dbId = await AsyncStorage.getItem('userDbId');
      if (!dbId) return;
      const token = await registerForPushNotificationsAsync();
      if (token && isMounted) await updatePushToken(dbId, token);
    };

    const pollForAnnouncements = async () => {
      try {
        const dbId = await AsyncStorage.getItem('userDbId');
        if (!dbId || !isMounted) return;

        const res = await getStudentNotifications(dbId);
        const notifications = res?.notifications || [];
        const latest = notifications.filter((n: any) => n.type === 'broadcast')[0];

        if (latest && latest.id !== lastSeenIdRef.current) {
          if (lastSeenIdRef.current !== null) {
            const rawMessage = latest.message || latest.text || '';
            const parsed = parseBroadcastMessage(rawMessage);
            const subject = latest.title || parsed.subject;
            const body = parsed.body;
            scheduleLocalNotification(
              'New Campus Announcement',
              subject,
              { subject, body }
            );
            setAnnouncement({ title: 'Admin Broadcast', subject, body });
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('refreshAlerts');
          }
          lastSeenIdRef.current = latest.id;
        }
      } catch (err) {}
    };

    initializeNotifications();
    const interval = setInterval(pollForAnnouncements, 30000);

    const cleanup = setupNotificationListeners(
      (notification) => {
        const { title, body, data } = notification.request.content;
        const payload = data ?? {};
        const parsed = parseBroadcastMessage(payload.body ?? payload.message ?? body ?? '');
        const subject = payload.subject ?? title ?? parsed.subject;
        const finalBody = payload.body ?? payload.message ?? parsed.body;
        if (isMounted) {
          setAnnouncement({
            title: title ?? 'Admin Broadcast',
            subject,
            body: finalBody,
          });
          const { DeviceEventEmitter } = require('react-native');
          DeviceEventEmitter.emit('refreshAlerts');
        }
      },
      (response) => {
        const { title, body, data } = response.notification.request.content;
        const payload = data ?? {};
        const parsed = parseBroadcastMessage(payload.body ?? payload.message ?? body ?? '');
        const subject = payload.subject ?? title ?? parsed.subject;
        const finalBody = payload.body ?? payload.message ?? parsed.body;
        if (isMounted) {
          setAnnouncement({
            title: title ?? 'Admin Broadcast',
            subject,
            body: finalBody,
          });
          const { DeviceEventEmitter } = require('react-native');
          DeviceEventEmitter.emit('refreshAlerts');
        }
      }
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
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
        subject={announcement?.subject}
        message={announcement?.body ?? ''}
        onClose={() => setAnnouncement(null)}
      />
    </>
  );
}