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

  const lastSyncTime = useRef<number>(0); 
  const FIFTEEN_MINUTES = 15 * 60 * 1000; 

  useEffect(() => {
    const currentTime = Date.now();

    // 15-Minute Background Sync to Admin Map
    if (location && (currentTime - lastSyncTime.current > FIFTEEN_MINUTES)) {
      console.log("🕒 Syncing continuous location to Laravel Admin...");
      
      syncStudentData({
        studentId: "kefnbjhf",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        battery: 100,
        timestamp: new Date().toISOString()
      }).then((success) => {
        if (success) {
          lastSyncTime.current = currentTime; 
        }
      });
    }
  }, [location]);

  const handleSOSAction = async (type: 'emergency' | 'safe' | 'help') => {
    setMenuVisible(false);
    setActiveType(type);

    // Instant SOS Trigger
    await sendSOS({ type, location, studentId: "kefnbjhf" });

    if (type === 'emergency') {
      const videoUri = await startEmergencyCapture();
      if (videoUri) {
        await uploadEmergencyVideo(videoUri, "kefnbjhf");
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