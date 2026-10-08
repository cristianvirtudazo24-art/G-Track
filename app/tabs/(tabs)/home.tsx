import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';
import { HomeView } from '../../../components/HomeView';
import { SafeConfirmModal } from '../../../components/SafeConfirmModal';
import { StatusSuccessModal } from '../../../components/StatusSuccessModal';
import { useEmergencyRecord } from '../../../hooks/useEmergencyRecord';
import { useLocation } from '../../../hooks/useLocation';
import { useNetworkInfo } from '../../../hooks/useNetworkInfo';
import { useUser } from '../../../hooks/useUser';
import { getRecentLocations, getStudentStatus, sendBlackoutAlert, sendSOS, uploadEmergencyVideo } from '../../../services/api';

export default function HomeScreen() {
  const { session, loading } = useUser();
  const { location, errorMsg } = useLocation();
  const { cameraRef, startEmergencyCapture, isRecording } = useEmergencyRecord();
  const { getFormattedNetworkInfo } = useNetworkInfo();

  const [menuVisible, setMenuVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [safeConfirmVisible, setSafeConfirmVisible] = useState(false);
  const [activeType, setActiveType] = useState<'help' | 'safe' | 'blackout' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'safe' | 'help' | 'blackout'>('safe');
  const [videoSent, setVideoSent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [otherStudents, setOtherStudents] = useState<any[]>([]);
  const [customModalTitle, setCustomModalTitle] = useState<string | undefined>(undefined);
  const [customModalSub, setCustomModalSub] = useState<string | undefined>(undefined);

  // Initial status restoration from AsyncStorage
  useEffect(() => {
    const restoreSavedStatus = async () => {
      const saved = await AsyncStorage.getItem('sosStatus');
      if (saved === 'help' || saved === 'blackout' || saved === 'safe') {
        setCurrentStatus(saved as any);
      }
    };
    restoreSavedStatus();
  }, []);

  // Poll for status updates and classmate locations from server
  useEffect(() => {
    const studentTargetId = session?.dbId || session?.studentId;
    if (!studentTargetId) return;

    const pollStatusAndLocations = async () => {
      const statusData = await getStudentStatus(studentTargetId);
      if (statusData && statusData.sos_status !== undefined) {
        const rawStatus = String(statusData.sos_status).toLowerCase().trim();
        let serverStatus: 'safe' | 'help' | 'blackout' = 'safe';

        if (rawStatus === 'help' || rawStatus === 'danger' || rawStatus === 'sos') {
          serverStatus = 'help';
        } else if (rawStatus === 'blackout') {
          serverStatus = 'blackout';
        } else {
          // 'safe', 'resolved', 'normal', 'ok', 'acknowledged' -> safe
          serverStatus = 'safe';
        }

        setCurrentStatus(serverStatus);
        await AsyncStorage.setItem('sosStatus', serverStatus);
      }

      // Fetch classmate locations to pin on the map
      const locations = await getRecentLocations();
      if (Array.isArray(locations)) {
        const filtered = locations
          .filter((loc: any) => {
            const isSelf = String(loc.student?.id) === String(session.dbId) || 
                           String(loc.student_id) === String(session.studentId) ||
                           String(loc.student?.student_id) === String(session.studentId);
            return !isSelf;
          })
          .map((loc: any) => ({
            id: loc.id || loc.student?.id || Math.random(),
            name: loc.student?.name || 'Student',
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            sos_status: loc.sos_status || 'safe',
          }));
        setOtherStudents(filtered);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(pollStatusAndLocations, 10000);
    // Initial poll
    pollStatusAndLocations();

    return () => clearInterval(interval);
  }, [session.dbId, session.studentId]);

  if (loading) return null;

  const handleSOSAction = async (type: 'help' | 'safe' | 'blackout') => {
    setMenuVisible(false);
    setActiveType(type);
    setCurrentStatus(type);
    await AsyncStorage.setItem('sosStatus', type);
    setVideoSent(false); // reset on every new action
    setIsUploading(false);
    setCustomModalTitle(undefined);
    setCustomModalSub(undefined);

    const studentId = session.dbId ?? 'unknown';

    if (type === 'blackout') {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercent = Math.round(batteryLevel * 100);
      const signalStrength = getFormattedNetworkInfo();
      await sendBlackoutAlert({ studentId, battery: batteryPercent, signal: signalStrength, message: '' });
      setCurrentStatus('blackout');
      await AsyncStorage.setItem('sosStatus', 'blackout');
      setSuccessVisible(true);
    } else {
      // For 'help' type: 2-Stage Notification Flow
      if (type === 'help') {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercent = Math.round(batteryLevel * 100);
        const signalStrength = getFormattedNetworkInfo();

        // 🚨 STAGE 1: Send INSTANT Emergency SOS Notification #1 (0s delay)
        setCurrentStatus('help');
        await AsyncStorage.setItem('sosStatus', 'help');

        await sendSOS({ 
          type: 'help', 
          location, 
          studentId, 
          battery: batteryPercent, 
          signal: signalStrength 
        });
        console.log('🚨 STAGE 1: Instant Emergency SOS Notification sent to admin!');

        // Instantly notify user via pop-up modal for Stage 1 (Initial Alert Sent)
        setCustomModalTitle('Initial Alert Sent to Admin!');
        setCustomModalSub('An instant emergency SOS alert with your GPS location, battery level, and signal info was sent to the Admin! Now recording 9-second emergency video feed...');
        setSuccessVisible(true);

        // 📹 STAGE 2: Record 9-second Emergency Video and send Notification #2
        setIsUploading(true);
        const videoUri = await startEmergencyCapture();

        if (videoUri) {
          const uploadResult = await uploadEmergencyVideo({
            videoUri,
            studentId: String(studentId),
            message: 'Emergency Live Video Feed',
            latitude: location?.coords?.latitude,
            longitude: location?.coords?.longitude,
            battery_level: batteryPercent,
            signal: signalStrength,
            isEmergency: true,
          });

          setIsUploading(false);

          if (uploadResult) {
            setVideoSent(true);
            console.log('📹 STAGE 2: 9-Second Emergency Video uploaded successfully!');

            // Update pop-up modal text to Stage 2 (Video Attached)
            setCustomModalTitle('Emergency Video Feed Sent!');
            setCustomModalSub('Your 9-second live emergency video feed has been uploaded successfully and attached to your alert for the Admin. Stay safe!');
          } else {
            console.warn('Video upload failed - Stage 1 alert remains active');
          }
        } else {
          setIsUploading(false);
          console.warn('Video recording unavailable - Stage 1 alert remains active');
        }
      } else {
        // For 'safe' type, send safe check-in notification
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercent = Math.round(batteryLevel * 100);
        const signalStrength = getFormattedNetworkInfo();
        
        setCurrentStatus('safe');
        await AsyncStorage.setItem('sosStatus', 'safe');

        await sendSOS({ type: 'safe', location, studentId, battery: batteryPercent, signal: signalStrength });
        setSuccessVisible(true);
      }
    }
  };

  return (
    <>
      <HomeView
        location={location}
        otherStudents={otherStudents}
        errorMsg={errorMsg}
        modalVisible={menuVisible}
        setModalVisible={setMenuVisible}
        onSOSAction={handleSOSAction}
        onSafeAction={() => setSafeConfirmVisible(true)}
        cameraRef={cameraRef}
        isRecording={isRecording}
        studentName={session?.name ?? 'Student'}
        currentStatus={currentStatus}
        videoSent={videoSent}
        isUploading={isUploading}
      />
      <SafeConfirmModal
        isVisible={safeConfirmVisible}
        onClose={() => setSafeConfirmVisible(false)}
        onConfirm={() => handleSOSAction('safe')}
      />
      <StatusSuccessModal
        isVisible={successVisible}
        type={activeType}
        customTitle={customModalTitle}
        customSub={customModalSub}
        onClose={() => {
          setSuccessVisible(false);
          setActiveType(null);
          setCustomModalTitle(undefined);
          setCustomModalSub(undefined);
        }}
      />
    </>
  );
}