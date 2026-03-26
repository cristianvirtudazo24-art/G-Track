import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { syncStudentData } from '../services/api';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const lastSyncTime = useRef<number>(0);
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission denied');
        return;
      }

      let current = await Location.getCurrentPositionAsync({});
      setLocation(current);

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (newLocation) => {
          setLocation(newLocation);

          // --- 15 MINUTE CHECK ---
          const now = Date.now();
          if (now - lastSyncTime.current > FIFTEEN_MINUTES) {
            syncStudentData({
              studentId: "PN2026-0123",
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              battery: 100, // Linking to 100 for now
              timestamp: new Date().toISOString()
            }).then((success) => {
              if (success) lastSyncTime.current = now;
            });
          }
        }
      );
    })();
  }, []);

  return { location, errorMsg };
};