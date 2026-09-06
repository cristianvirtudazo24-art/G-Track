import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { syncStudentData } from '../services/api';

const LOCATION_TASK_NAME = 'background-location-task';
const ONE_HOUR = 60 * 60 * 1000;
const TIMELINE_MAX_ENTRIES = 48;
const TIMELINE_KEY_PREFIX = 'locationTimeline:';

export interface LocationTimelineEntry {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  placeName?: string;
}

const getTimelineStorageKey = (dbId: string) => `${TIMELINE_KEY_PREFIX}${dbId}`;

const loadTimelineFromStorage = async (dbId: string) => {
  try {
    const raw = await AsyncStorage.getItem(getTimelineStorageKey(dbId));
    if (!raw) return [] as LocationTimelineEntry[];
    const parsed = JSON.parse(raw) as LocationTimelineEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as LocationTimelineEntry[];
  }
};

const persistTimelineEntry = async (
  dbId: string,
  coords: Location.LocationObjectCoords,
  existingTimeline: LocationTimelineEntry[] = []
) => {
  try {
    const storageKey = getTimelineStorageKey(dbId);
    const now = Date.now();
    const lastTimestamp = existingTimeline.length
      ? new Date(existingTimeline[0].timestamp).getTime()
      : 0;

    if (now - lastTimestamp < ONE_HOUR) {
      return existingTimeline;
    }

    // Get place name using reverse geocoding
    let placeName = 'Unknown location';
    try {
      const geocodeResult = await (Location as any).reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (geocodeResult.length > 0) {
        const place = geocodeResult[0];
        const parts = [place.name, place.street, place.city, place.region, place.country].filter(Boolean);
        placeName = parts.slice(0, 2).join(', ') || 'Unknown location';
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      // Fallback to formatted coordinates
      placeName = `${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`;
    }

    const entry: LocationTimelineEntry = {
      id: `${now}`,
      timestamp: new Date(now).toISOString(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      placeName,
    };

    const nextTimeline = [entry, ...existingTimeline].slice(0, TIMELINE_MAX_ENTRIES);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextTimeline));
    return nextTimeline;
  } catch {
    return existingTimeline;
  }
};

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [timeline, setTimeline] = useState<LocationTimelineEntry[]>([]);

  const lastSyncTime = useRef<number>(0);
  const dbIdRef = useRef<string | null>(null);
  const timelineRef = useRef<LocationTimelineEntry[]>([]);
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  const startContinuousSharing = async (dbId: string) => {
    dbIdRef.current = dbId;
    setIsSharing(true);
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

      if (fgStatus !== 'granted' || bgStatus !== 'granted') {
        setErrorMsg('Background location permissions are required.');
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: FIFTEEN_MINUTES,
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: "G!Track Security Active",
          notificationBody: "Sharing your location with campus admin.",
        },
      });
    } catch (err) {
      console.error("Failed to start continuous sharing:", err);
    }
  };

  const stopContinuousSharing = async () => {
    setIsSharing(false);
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } catch (err) {
      console.error("Failed to stop continuous sharing:", err);
    }
  };

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        const dbId = await AsyncStorage.getItem('userDbId');

        if (role !== 'student') return;
        if (dbId) {
          dbIdRef.current = dbId;
          const storedTimeline = await loadTimelineFromStorage(dbId);
          timelineRef.current = storedTimeline;
          setTimeline(storedTimeline);
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(current);

        if (dbId && current?.coords) {
          const updatedTimeline = await persistTimelineEntry(dbId, current.coords, timelineRef.current);
          timelineRef.current = updatedTimeline;
          setTimeline(updatedTimeline);
        }

        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
            timeInterval: 60000,
          },
          async (newLocation) => {
            setLocation(newLocation);
            const now = Date.now();

            if (now - lastSyncTime.current > FIFTEEN_MINUTES && dbIdRef.current) {
              const batteryLevel = await Battery.getBatteryLevelAsync();
              const batteryPercent = Math.round(batteryLevel * 100);

              const storedStatus = await AsyncStorage.getItem('sosStatus') || 'safe';
              const formattedStatus = storedStatus === 'help' ? 'Help' : 'Safe';

              const success = await syncStudentData({
                studentId: dbIdRef.current,
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                battery: batteryPercent,
                status: formattedStatus,
              });

              if (success) lastSyncTime.current = now;
            }

            if (dbIdRef.current) {
              const updatedTimeline = await persistTimelineEntry(
                dbIdRef.current,
                newLocation.coords,
                timelineRef.current
              );
              timelineRef.current = updatedTimeline;
              setTimeline(updatedTimeline);
            }
          }
        );
      } catch (err) {
        console.warn("Location Service Error:", err);
        setErrorMsg("Location service error.");
      }
    })();

    return () => {
      if (watchSubscription) watchSubscription.remove();
    };
  }, []);

  return { location, errorMsg, isSharing, timeline, startContinuousSharing, stopContinuousSharing };
};