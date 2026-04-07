import * as Battery from 'expo-battery';
import React, { useState } from 'react';
import { HomeView } from '../../../components/HomeView';
import { StatusSuccessModal } from '../../../components/StatusSuccessModal';
import { useEmergencyRecord } from '../../../hooks/useEmergencyRecord';
import { useLocation } from '../../../hooks/useLocation';
import { useUser } from '../../../hooks/useUser';
import { sendBlackoutAlert, sendSOS, uploadEmergencyVideo } from '../../../services/api';

export default function HomeScreen() {
  const { session, loading } = useUser();
  const { location, errorMsg } = useLocation();
  const { cameraRef, startEmergencyCapture, isRecording } = useEmergencyRecord();

  const [menuVisible, setMenuVisible] = useState(false);
  const [blackoutModalVisible, setBlackoutModalVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [activeType, setActiveType] = useState<'emergency' | 'safe' | 'help' | null>(null);

  if (loading) return null; // Or a themed spinner

  const handleBlackoutSubmit = async (message: string) => {
    setBlackoutModalVisible(false);

    // Get real battery level
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryPercent = Math.round(batteryLevel * 100);

    // Call API with real studentId
    await sendBlackoutAlert({
      studentId: session.studentId ?? 'unknown',
      battery: batteryPercent,
      message,
    });

    // Reuse success modal for now
    setActiveType('safe');
    setSuccessVisible(true);
  };

  const handleSOSAction = async (type: 'emergency' | 'safe' | 'help') => {
    setMenuVisible(false);
    setActiveType(type);

    const studentId = session.studentId ?? 'unknown';

    await sendSOS({ type, location, studentId });

    if (type === 'emergency') {
      const videoUri = await startEmergencyCapture();
      if (videoUri) {
        await uploadEmergencyVideo(videoUri, studentId);
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
        blackoutModalVisible={blackoutModalVisible}
        setBlackoutModalVisible={setBlackoutModalVisible}
        onBlackoutSubmit={handleBlackoutSubmit}
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