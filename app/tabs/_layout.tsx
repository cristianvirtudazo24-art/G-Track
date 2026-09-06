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
const ONE_HOUR = 60 * 60 * 1000;
const TIMELINE_KEY_PREFIX = 'locationTimeline:';
let lastSyncTime = 0;

const getTimelineStorageKey = (dbId: string) => `${TIMELINE_KEY_PREFIX}${dbId}`;

const saveTimelineSnapshot = async (dbId: string, location: any) => {
  try {
    const storageKey = getTimelineStorageKey(dbId);
    const raw = await AsyncStorage.getItem(storageKey);
    const existing = raw ? (JSON.parse(raw) as any[]) : [];
    const lastSavedAt = existing.length ? new Date(existing[0].timestamp).getTime() : 0;
    const now = Date.now();
    if (now - lastSavedAt < ONE_HOUR) {
      return;
    }

    // Get place name using reverse geocoding
    let placeName = 'Unknown location';
    try {
      const geocodeResult = await (Location as any).reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocodeResult.length > 0) {
        const place = geocodeResult[0];
        const parts = [place.name, place.street, place.city, place.region, place.country].filter(Boolean);
        placeName = parts.slice(0, 2).join(', ') || 'Unknown location';
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      // Fallback to formatted coordinates
      placeName = `${location.coords.latitude.toFixed(4)}°N, ${location.coords.longitude.toFixed(4)}°E`;
    }

    const next = [
      {
        id: `${now}`,
        timestamp: new Date(now).toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        placeName,
      },
      ...existing,
    ].slice(0, 48);

    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  } catch (err) {
    // Keep timeline save best-effort only.
  }
};

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
      const storedStatus = await AsyncStorage.getItem('sosStatus') || 'safe';
      const formattedStatus = storedStatus === 'help' ? 'Help' : 'Safe';

      await syncStudentData({
        studentId: dbId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        battery: batteryPercent,
        status: formattedStatus,
        timestamp: new Date().toISOString()
      });
      await saveTimelineSnapshot(dbId, location);
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