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

        // Record with optimized settings for file size
        // Target: Keep under 20MB for backend requirement
        let video = await cameraRef.current.recordAsync({
          maxDuration: 5, // 5 seconds max
          maxFileSize: 20 * 1024 * 1024, // 20MB limit per backend spec
        });

        if (video?.uri) {
          // Get file info to check size
          const fileInfo = await getInfoAsync(video.uri) as any;
          console.log('Recorded video size:', fileInfo.size, 'bytes (~', Math.round(fileInfo.size / 1024 / 1024), 'MB)');

          // If file is larger than 20MB, compress
          if (fileInfo.size > 20 * 1024 * 1024) {
            console.warn('Video exceeds 20MB limit, attempting recompression...');
            // Delete the large file
            await deleteAsync(video.uri, { idempotent: true });

            // Record shorter duration
            video = await cameraRef.current.recordAsync({
              maxDuration: 3, // Reduce to 3 seconds if previous was too large
            });

            if (video?.uri) {
              const newFileInfo = await getInfoAsync(video.uri) as any;
              console.log('Recompressed video size:', newFileInfo.size, 'bytes (~', Math.round(newFileInfo.size / 1024 / 1024), 'MB)');
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