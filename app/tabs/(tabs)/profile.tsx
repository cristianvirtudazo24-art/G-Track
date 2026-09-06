import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../../constants/theme';
import { useLocation } from '../../../hooks/useLocation';
import { useNetworkInfo } from '../../../hooks/useNetworkInfo';
import { useUser } from '../../../hooks/useUser';
import { uploadProfilePicture } from '../../../services/api';

const getProfilePhotoKey = (studentId: string | number) => `studentProfilePhoto_${studentId}`;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 36) : 44, 36);

  const router = useRouter();
  const { session, loading, clearSession } = useUser();
  const { stopContinuousSharing } = useLocation();
  const { networkInfo } = useNetworkInfo();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const profileData = session.profile || {
    student_id: session.studentId,
    email: session.email,
    name: session.name,
    gender: session.gender,
  };

  // Load saved profile photo from AsyncStorage on mount
  useEffect(() => {
    if (!session.studentId) return;
    const key = getProfilePhotoKey(session.studentId);
    AsyncStorage.getItem(key).then((uri) => {
      if (uri) setProfilePhoto(uri);
    });
  }, [session.studentId]);

  // Battery level tracking
  useEffect(() => {
    let active = true;
    async function getBattery() {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (active) setBatteryLevel(Math.round(level * 100));
      } catch (err) {
        console.log('Could not get battery level:', err);
      }
    }
    getBattery();
    const subscription = Battery.addBatteryLevelListener(({ batteryLevel: newLevel }) => {
      if (active) setBatteryLevel(Math.round(newLevel * 100));
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const handleLogout = () => {
    const performLogout = async () => {
      await stopContinuousSharing();
      await clearSession();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) performLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const pickedUri = result.assets[0].uri;
    setUploadingPhoto(true);

    try {
      // Save locally immediately for instant feedback
      setProfilePhoto(pickedUri);
      if (session.studentId) {
        await AsyncStorage.setItem(getProfilePhotoKey(session.studentId), pickedUri);
      }

      // Try uploading to server if connected
      const studentDbId = session.dbId || session.studentId;
      if (networkInfo.isConnected && studentDbId) {
        const uploadResult = await uploadProfilePicture(studentDbId, pickedUri);
        if (uploadResult?.success && uploadResult?.photo_url) {
          // Use the server URL if upload succeeded
           if (session.studentId) {
             await AsyncStorage.setItem(getProfilePhotoKey(session.studentId), uploadResult.photo_url);
           }
          setProfilePhoto(uploadResult.photo_url);
        }
      }
    } catch (err) {
      console.warn('Profile photo upload error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return null;

  const formatGender = (val: string | null) => {
    if (!val) return 'Not specified';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  };

  let createdDate = 'Apr 1, 2026';
  const rawCreated = profileData.created_at || profileData.created || session.profile?.created_at;
  if (rawCreated) {
    try {
      const d = new Date(rawCreated);
      createdDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      createdDate = String(rawCreated);
    }
  }

  const email = profileData.email || session.email || 'No email set';
  const name = profileData.name || session.name || 'Student';
  const studentId = profileData.student_id || session.studentId || 'STU0000000';
  const gender = formatGender(profileData.gender || session.gender);
  const classVal = profileData.class || session.profile?.class || '2026';
  const contact = profileData.phone || profileData.contact || session.profile?.phone || 'Not specified';

  // Real online status from network connectivity
  const isOnline = networkInfo.isConnected;
  const statusColor = isOnline ? '#10B981' : '#94A3B8';
  const statusLabel = isOnline ? 'Online' : 'Offline';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        {/* Avatar with tap-to-upload */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickPhoto}
          activeOpacity={0.8}
          disabled={uploadingPhoto}
        >
          <View style={styles.avatarCircle}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account-outline" size={54} color="#FFFFFF" />
            )}
          </View>
          {/* Camera badge */}
          <View style={styles.cameraBadge}>
            <MaterialCommunityIcons name="camera" size={11} color="#FFFFFF" />
          </View>
          {/* Online status dot */}
          <View style={[styles.avatarStatusDot, { backgroundColor: statusColor }]} />
        </TouchableOpacity>

        <Text style={styles.name}>{name}</Text>

        <View style={styles.badgesRow}>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{studentId}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Upload hint */}
        <Text style={styles.uploadHint}>Tap your avatar to change profile picture</Text>

        {/* Card 1: User Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>User Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons
                name={gender.toLowerCase() === 'female' ? 'gender-female' : 'gender-male'}
                size={16}
                color="#1E2F97"
              />
            </View>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{gender}</Text>
          </View>
        </View>

        {/* Card 2: Student Credentials */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Student Credentials</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="battery" size={16} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Battery Level</Text>
            <View style={styles.batteryContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${batteryLevel ?? 100}%` }]} />
              </View>
              <Text style={styles.batteryText}>{batteryLevel !== null ? `${batteryLevel}%` : '100%'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="wifi" size={16} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Network</Text>
            <Text style={[styles.infoValue, { color: isOnline ? '#10B981' : '#94A3B8' }]}>
              {isOnline ? networkInfo.connectionType : 'Disconnected'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="school-outline" size={16} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>{classVal}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{contact}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons name="calendar-outline" size={16} color="#1E2F97" />
            </View>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>{createdDate}</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#1E2F97',
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 16,
    right: -2,
    backgroundColor: '#1E2F97',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    bottom: 0,
    right: 18,
    borderWidth: 2,
    borderColor: '#1E2F97',
  },
  name: {
    fontSize: 20,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  idText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: '#334155',
  },
  uploadHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: -4,
  },
  body: {
    padding: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: 'rgba(30, 47, 151, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoIconWrap: {
    backgroundColor: '#EEF2FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'right',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    width: 60,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.bold,
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FEE2E2',
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: Typography.fontWeight.bold,
    fontSize: 15,
  },
});