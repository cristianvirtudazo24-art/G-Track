import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { getInfoAsync } from 'expo-file-system/legacy';
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

        // Record an SOS video of up to ~10 seconds.
        // This gives a longer emergency clip for help alerts.
        let video = await cameraRef.current.recordAsync({
          maxDuration: 10, // about 10 seconds max
        });

        if (video?.uri) {
          const fileInfo = await getInfoAsync(video.uri) as any;
          console.log('Recorded video size:', fileInfo.size, 'bytes (~', Math.round(fileInfo.size / 1024 / 1024), 'MB)');
          return video.uri;
        }
        return null;
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