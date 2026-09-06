import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationCard } from './LocationCard';
import { SOSModal } from './SOSModal';
import { StudentMapView } from './StudentMapView';

export const HomeView = ({
  location = null,
  errorMsg = null,
  modalVisible = false,
  setModalVisible = () => {},
  onSOSAction = () => {},
  onSafeAction = () => {},
  cameraRef = null,
  studentName = 'Student',
  currentStatus = 'safe',
}: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 36) : 44, 36);

  // Status configuration for the header pill
  const getStatusPillConfig = () => {
    switch (currentStatus) {
      case 'help':
        return {
          text: 'Emergency',
          color: '#F87171',
          borderColor: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
          icon: 'alert-circle' as const,
        };
      case 'blackout':
        return {
          text: 'Blackout',
          color: '#FB923C',
          borderColor: '#F97316',
          bgColor: 'rgba(249, 115, 22, 0.15)',
          icon: 'lightning-bolt' as const,
        };
      default: // safe
        return {
          text: 'Safe',
          color: '#34D399',
          borderColor: '#059669',
          bgColor: 'rgba(5, 150, 105, 0.15)',
          icon: 'shield-check-outline' as const,
        };
    }
  };

  const statusPill = getStatusPillConfig();

  return (
    <View style={styles.outer}>
      <CameraView
        ref={cameraRef}
        mode="video"
        facing="front"
        style={styles.hideCam}
      />

      {/* Header Section */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            G!Track Dashboard
          </Text>
        </View>

        <View style={styles.headerBottomRow}>
          <View style={styles.studentNameWrap}>
            <Text style={styles.studentNameText} numberOfLines={1}>
              {studentName}
            </Text>
          </View>
          <View style={[styles.statusPill, { borderColor: statusPill.borderColor, backgroundColor: statusPill.bgColor }]}>
            <MaterialCommunityIcons name={statusPill.icon} size={15} color={statusPill.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusPillText, { color: statusPill.color }]}>{statusPill.text}</Text>
          </View>
        </View>
      </View>

      {/* Current Location Card */}
      <LocationCard
        location={location}
        errorMsg={errorMsg}
      />

      {/* Full-width Map Section */}
      <View style={styles.mapWrapper}>
        <StudentMapView
          location={location}
          errorMsg={errorMsg}
        />
      </View>

      {/* Quick Actions Footer */}
      <View style={styles.footer}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.btnRow}>
          {/* SOS Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.sosBtn]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.btnContent}>
              <View style={styles.iconCircleRed}>
                <MaterialCommunityIcons name="alert-outline" size={20} color="white" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitle}>SOS</Text>
                <Text style={styles.btnSub}>Report emergency</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="white" style={styles.chevron} />
          </TouchableOpacity>

          {/* I'm Safe Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.safeBtn]}
            onPress={onSafeAction}
            activeOpacity={0.85}
          >
            <View style={styles.btnContent}>
              <View style={styles.iconCircleGreen}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="white" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitle}>I&apos;m Safe</Text>
                <Text style={styles.btnSub}>Send check-in</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="white" style={styles.chevron} />
          </TouchableOpacity>
        </View>
      </View>

      <SOSModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectAction={onSOSAction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  hideCam: {
    height: 1,
    width: 1,
    opacity: 0,
    position: 'absolute',
  },
  header: {
    backgroundColor: '#1E2F97',
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  studentNameWrap: {
    flex: 1,
    marginRight: 12,
  },
  studentNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E5E7EB',
  },
  footer: {
    backgroundColor: '#F5F7FF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.6,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sosBtn: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  safeBtn: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircleRed: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconCircleGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  btnTextCol: {
    justifyContent: 'center',
  },
  btnTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  chevron: {
    opacity: 0.8,
  },
});