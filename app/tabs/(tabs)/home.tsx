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
  const [successVisible, setSuccessVisible] = useState(false);
  const [activeType, setActiveType] = useState<'help' | 'safe' | 'blackout' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'safe' | 'help' | 'blackout'>('safe');
  const [videoSent, setVideoSent] = useState(false);

  if (loading) return null;

  const handleSOSAction = async (type: 'help' | 'safe' | 'blackout') => {
    setMenuVisible(false);
    setActiveType(type);
    setCurrentStatus(type === 'safe' ? 'safe' : type);
    setVideoSent(false); // reset on every new action

    const studentId = session.dbId ?? 'unknown';

    if (type === 'blackout') {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);
      await sendBlackoutAlert({ studentId, battery: batteryPercent, message: '' });
    } else {
      await sendSOS({ type, location, studentId });

      if (type === 'help') {
        const videoUri = await startEmergencyCapture();
        if (videoUri) {
          await uploadEmergencyVideo(videoUri, String(studentId));
          setVideoSent(true); // flip to true AFTER upload completes
        }
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
        onSafeAction={() => handleSOSAction('safe')}
        cameraRef={cameraRef}
        isRecording={isRecording}
        studentName={session?.name ?? 'Student'}
        currentStatus={currentStatus}
        videoSent={videoSent}
      />
      <StatusSuccessModal
        isVisible={successVisible}
        type={activeType}
        onClose={() => setSuccessVisible(false)}
      />
    </>
  );
}