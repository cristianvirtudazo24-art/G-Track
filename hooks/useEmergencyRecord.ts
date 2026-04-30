import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { deleteAsync, getInfoAsync } from 'expo-file-system/legacy';
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

        // Try recording with lower quality first
        let video = await cameraRef.current.recordAsync({
          maxDuration: 5,
        });

        if (video?.uri) {
          // Get file info to check size
          const fileInfo = await getInfoAsync(video.uri) as any;
          console.log('Recorded video size:', fileInfo.size, 'bytes (~', Math.round(fileInfo.size / 1024 / 1024), 'MB)');

          // If file is still too large (>6MB), try lowest quality
          if (fileInfo.size > 6 * 1024 * 1024) {
            console.warn('Video too large, trying lowest quality...');
            // Delete the large file
            await deleteAsync(video.uri, { idempotent: true });

            // Record with lowest quality
            video = await cameraRef.current.recordAsync({
              maxDuration: 3, // Even shorter duration
            });

            if (video?.uri) {
              const newFileInfo = await getInfoAsync(video.uri) as any;
              console.log('Compressed video size:', newFileInfo.size, 'bytes (~', Math.round(newFileInfo.size / 1024 / 1024), 'MB)');
            }
          }

          return video?.uri;
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