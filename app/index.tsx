import React, { useEffect, useRef, useState } from 'react';
import { HomeView } from '../components/HomeView';
import { StatusSuccessModal } from '../components/StatusSuccessModal';
import { useEmergencyRecord } from '../hooks/useEmergencyRecord';
import { useLocation } from '../hooks/useLocation';
import { sendSOS, syncStudentData, uploadEmergencyVideo } from '../services/api';

export default function HomeScreen() {
  const { location, errorMsg } = useLocation();
  const { cameraRef, startEmergencyCapture, isRecording } = useEmergencyRecord();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [activeType, setActiveType] = useState<'emergency' | 'safe' | 'help' | null>(null);

  // --- 15 MINUTE TIMER LOGIC ---
  const lastSyncTime = useRef<number>(0); 
  const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 mins in milliseconds

  useEffect(() => {
    const currentTime = Date.now();

    // Check: Do we have location? Has it been 15 minutes?
    if (location && (currentTime - lastSyncTime.current > FIFTEEN_MINUTES)) {
      
      console.log("🕒 15 Minutes passed. Syncing to Admin...");
      
      syncStudentData({
        studentId: "PN2026-0123",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        battery: 100,
        timestamp: new Date().toISOString()
      }).then((success) => {
        if (success) {
          // Only update the timer if the server actually received it
          lastSyncTime.current = currentTime; 
        }
      });
    }
  }, [location]); // useEffect triggers on every GPS move, but 'if' blocks the API call

  // --- INSTANT SOS (Ignores the 15-min timer) ---
  const handleSOSAction = async (type: 'emergency' | 'safe' | 'help') => {
    setMenuVisible(false);
    setActiveType(type);

    await sendSOS({ type, location, studentId: "PN2026-0123" });

    if (type === 'emergency') {
      const videoUri = await startEmergencyCapture();
      if (videoUri) {
        await uploadEmergencyVideo(videoUri, "PN2026-0123");
      }
    }
    setSuccessVisible(true);
  };

  return (
    <>
      <HomeView 
        location={location}
        errorMsg={errorMsg}
        modalVisible={menuVisible}
        setModalVisible={setMenuVisible}
        onSOSAction={handleSOSAction}
        cameraRef={cameraRef}
        isRecording={isRecording}
      />
      <StatusSuccessModal 
        isVisible={successVisible}
        type={activeType}
        onClose={() => setSuccessVisible(false)}
      />
    </>
  );
}