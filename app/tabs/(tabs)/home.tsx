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
  const [isUploading, setIsUploading] = useState(false);

  if (loading) return null;

  const handleSOSAction = async (type: 'help' | 'safe' | 'blackout') => {
    setMenuVisible(false);
    setActiveType(type);
    setCurrentStatus(type === 'safe' ? 'safe' : type);
    setVideoSent(false); // reset on every new action
    setIsUploading(false);

    const studentId = session.dbId ?? 'unknown';

    if (type === 'blackout') {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);
      await sendBlackoutAlert({ studentId, battery: batteryPercent, message: '' });
    } else {
      // For 'help' type, upload video first, then send notification
      if (type === 'help') {
        const videoUri = await startEmergencyCapture();
        if (videoUri) {
          const batteryLevel = await Battery.getBatteryLevelAsync();
          const batteryPercent = Math.round(batteryLevel * 100);
          const signalStrength = 'Good';

          // Start uploading video
          setIsUploading(true);
          const uploadResult = await uploadEmergencyVideo({
            videoUri,
            studentId: String(studentId),
            message: 'Live Emergency Feed',
            latitude: location?.coords?.latitude,
            longitude: location?.coords?.longitude,
            battery_level: batteryPercent,
            signal: signalStrength,
          });

          setIsUploading(false);

          if (uploadResult) {
            // Only send SOS notification after video upload succeeds
            await sendSOS({ type, location, studentId });
            setVideoSent(true);
          } else {
            console.error('Video upload failed, not sending SOS notification');
            alert('Failed to upload emergency video. Please try again.');
            return;
          }
        } else {
          console.error('Video recording failed');
          alert('Failed to record emergency video. Please try again.');
          return;
        }
      } else {
        // For 'safe' type, just send the notification
        await sendSOS({ type, location, studentId });
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
        isUploading={isUploading}
      />
      <StatusSuccessModal
        isVisible={successVisible}
        type={activeType}
        onClose={() => setSuccessVisible(false)}
      />
    </>
  );
}