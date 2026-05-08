import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { syncStudentData } from '../services/api';

const LOCATION_TASK_NAME = 'background-location-task';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  const lastSyncTime = useRef<number>(0);
  const dbIdRef = useRef<string | null>(null);
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
        if (dbId) dbIdRef.current = dbId;

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(current);

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

              const success = await syncStudentData({
                studentId: dbIdRef.current,
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                battery: batteryPercent,
                status: "Safe",
              });

              if (success) lastSyncTime.current = now;
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

  return { location, errorMsg, isSharing, startContinuousSharing, stopContinuousSharing };
};