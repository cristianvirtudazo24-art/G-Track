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

  if (loading) return null;

  const handleBlackoutSubmit = async (message: string) => {
    setBlackoutModalVisible(false);

    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryPercent = Math.round(batteryLevel * 100);

    await sendBlackoutAlert({
      studentId: session.dbId ?? 'unknown',
      battery: batteryPercent,
      message,
    });

    setActiveType('safe');
    setSuccessVisible(true);
  };

  const handleSOSAction = async (type: 'emergency' | 'safe' | 'help') => {
    setMenuVisible(false);
    setActiveType(type);

    const studentId = session.dbId ?? 'unknown';

    await sendSOS({ type, location, studentId });

    if (type === 'emergency') {
      const videoUri = await startEmergencyCapture();
      if (videoUri) {
        await uploadEmergencyVideo(videoUri, String(studentId));
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