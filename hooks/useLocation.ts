import * as Battery from 'expo-battery'; // 1. Import Battery
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { syncStudentData } from '../services/api';

const LOCATION_TASK_NAME = 'background-location-task';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const lastSyncTime = useRef<number>(0);
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  const startContinuousSharing = async () => {
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
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let current = await Location.getCurrentPositionAsync({});
      setLocation(current);

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        async (newLocation) => { // Added async here
          setLocation(newLocation);

          const now = Date.now();
          if (now - lastSyncTime.current > FIFTEEN_MINUTES) {
            
            // 2. GET REAL BATTERY LEVEL
            const batteryLevel = await Battery.getBatteryLevelAsync();
            const batteryPercent = Math.round(batteryLevel * 100);

            syncStudentData({
              studentId: "kefnbjhf",
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              battery: batteryPercent, // 3. Use real percentage
              status: "Active",
              timestamp: new Date().toISOString()
            }).then((success) => {
              if (success) lastSyncTime.current = now;
            });
          }
        }
      );
    })();
  }, []);

  return { location, errorMsg, startContinuousSharing };
};