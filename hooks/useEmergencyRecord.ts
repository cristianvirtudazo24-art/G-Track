import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRef, useState } from 'react';

export const useEmergencyRecord = () => {
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const startEmergencyCapture = async () => {
    if (!cameraPermission?.granted || !microphonePermission?.granted) {
      await requestCameraPermission();
      await requestMicrophonePermission();
    }

    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({ maxDuration: 10 });
        return video?.uri;
      } catch (error) {
        console.error("Record Error:", error);
        return null;
      } finally {
        setIsRecording(false);
      }
    }
    return null;
  };

  return { cameraRef, startEmergencyCapture, isRecording };
};