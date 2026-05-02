import * as Battery from 'expo-battery';
import React, { useEffect, useState } from 'react';
import { HomeView } from '../../../components/HomeView';
import { StatusSuccessModal } from '../../../components/StatusSuccessModal';
import { useEmergencyRecord } from '../../../hooks/useEmergencyRecord';
import { useLocation } from '../../../hooks/useLocation';
import { useNetworkInfo } from '../../../hooks/useNetworkInfo';
import { useUser } from '../../../hooks/useUser';
import { getStudentStatus, sendBlackoutAlert, sendSOS, uploadEmergencyVideo } from '../../../services/api';

export default function HomeScreen() {
  const { session, loading } = useUser();
  const { location, errorMsg } = useLocation();
  const { cameraRef, startEmergencyCapture, isRecording } = useEmergencyRecord();
  const { networkInfo, getFormattedNetworkInfo } = useNetworkInfo();

  const [menuVisible, setMenuVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [activeType, setActiveType] = useState<'help' | 'safe' | 'blackout' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'safe' | 'help' | 'blackout'>('safe');
  const [videoSent, setVideoSent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Poll for status updates from server
  useEffect(() => {
    if (!session.dbId) return;

    const pollStatus = async () => {
      if (session.dbId) {
        const statusData = await getStudentStatus(session.dbId);
        if (statusData && statusData.sos_status) {
          const serverStatus = statusData.sos_status === 'safe' ? 'safe' : 'help';
          setCurrentStatus(serverStatus);
        }
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(pollStatus, 10000);
    // Initial poll
    pollStatus();

    return () => clearInterval(interval);
  }, [session.dbId]);

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
      const signalStrength = getFormattedNetworkInfo();
      await sendBlackoutAlert({ studentId, battery: batteryPercent, signal: signalStrength, message: '' });
    } else {
      // For 'help' type, try to upload video, then send notification (regardless of video success)
      if (type === 'help') {
        const videoUri = await startEmergencyCapture();
        let videoMessage = 'Video feed is not available'; // Default message
        
        if (videoUri) {
          const batteryLevel = await Battery.getBatteryLevelAsync();
          const batteryPercent = Math.round(batteryLevel * 100);
          const signalStrength = getFormattedNetworkInfo();

          // Start uploading video
          setIsUploading(true);
          const uploadResult = await uploadEmergencyVideo({
            videoUri,
            studentId: String(studentId),
            message: 'Emergency - I Need Help',
            latitude: location?.coords?.latitude,
            longitude: location?.coords?.longitude,
            battery_level: batteryPercent,
            signal: signalStrength,
            isEmergency: true, // Mark this as SOS emergency
          });

          setIsUploading(false);

          // If video upload succeeds, update message
          if (uploadResult) {
            videoMessage = 'Live Emergency Feed';
            setVideoSent(true);
            console.log('Video uploaded successfully');
          } else {
            console.warn('Video upload failed, sending SOS with unavailable message');
            videoMessage = 'Video feed is not available';
          }
        } else {
          console.warn('Video recording failed, sending SOS with unavailable message');
          videoMessage = 'Video feed is not available';
        }

        // Send SOS notification regardless of video upload success
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercent = Math.round(batteryLevel * 100);
        const signalStrength = getFormattedNetworkInfo();
        await sendSOS({ type, location, studentId, battery: batteryPercent, signal: signalStrength });
        
      } else {
        // For 'safe' type, just send the notification
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercent = Math.round(batteryLevel * 100);
        const signalStrength = getFormattedNetworkInfo();
        await sendSOS({ type, location, studentId, battery: batteryPercent, signal: signalStrength });
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