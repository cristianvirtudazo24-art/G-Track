import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationCard } from './LocationCard';
import { SOSButton } from './SOSButton';
import { SOSModal } from './SOSModal';

const { width } = Dimensions.get('window');

const HEADER_CONFIG = {
  safe: {
    bg: '#1E2F97',
    icon: 'shield-check' as const,
    iconColor: '#6EE7B7',
  },
  help: {
    bg: '#C0192A',
    icon: 'alert-circle' as const,
    iconColor: '#FECDD3',
  },
  blackout: {
    bg: '#C2410C',
    icon: 'lightning-bolt' as const,
    iconColor: '#FED7AA',
  },
};

export const HomeView = (props: any) => {
  const currentStatus: 'safe' | 'help' | 'blackout' = props.currentStatus ?? 'safe';
  const hdr = HEADER_CONFIG[currentStatus];
  const studentName = props.studentName ?? 'Student';

  const renderHeaderContent = () => {
    if (currentStatus === 'help') {
      return (
        <>
          <View style={styles.headerStatusRow}>
            <MaterialCommunityIcons name={hdr.icon} size={18} color={hdr.iconColor} />
            <Text style={styles.headerStatusLabel}>EMERGENCY</Text>
          </View>
          <Text style={styles.headerTitle}>{studentName} needed help</Text>
          <Text style={styles.headerSub}>
            {props.isUploading ? '📤 Uploading video...' : '📹 Camera is recording'}
          </Text>
        </>
      );
    }
    if (currentStatus === 'blackout') {
      return (
        <>
          <View style={styles.headerStatusRow}>
            <MaterialCommunityIcons name={hdr.icon} size={18} color={hdr.iconColor} />
            <Text style={styles.headerStatusLabel}>BLACKOUT ALERT</Text>
          </View>
          <Text style={styles.headerTitle}>{studentName}</Text>
          <Text style={styles.headerSub}>⚡ Blackout alert sent to admin</Text>
        </>
      );
    }
    // default: safe
    return (
      <>
        <Text style={styles.headerGreeting}>{studentName}</Text>
        <Text style={styles.headerTitle}>G!Track Dashboard</Text>
        <View style={styles.headerStatusRow}>
          <MaterialCommunityIcons name={hdr.icon} size={15} color={hdr.iconColor} />
          <Text style={[styles.headerStatusLabel, { color: hdr.iconColor }]}>Safe</Text>
        </View>
      </>
    );
  };

  return (
    <View style={styles.outer}>
      <CameraView
        ref={props.cameraRef}
        mode="video"
        facing="front"
        style={styles.hideCam}
      />

      <View style={[styles.header, { backgroundColor: hdr.bg }]}>
        <View style={{ flex: 1 }}>
          {renderHeaderContent()}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LocationCard
          location={props.location}
          errorMsg={props.errorMsg}
        />

        <View style={styles.btnSection}>
          <Text style={styles.sectionLabel}>EMERGENCY ACTIONS</Text>
          <SOSButton onPress={() => props.setModalVisible(true)} />
        </View>

        <View style={styles.btnSection}>
          <Text style={styles.sectionLabel}>SAFETY CHECK-IN</Text>
          <TouchableOpacity
            style={styles.safeCard}
            onPress={props.onSafeAction}
            activeOpacity={0.85}
          >
            <View style={styles.safeIconContainer}>
              <MaterialCommunityIcons name="shield-check" size={28} color="white" />
            </View>
            <View style={styles.safeTextContainer}>
              <Text style={styles.safeTitle}>I am Safe</Text>
              <Text style={styles.safeSubtitle}>Send a safety check-in to admin</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SOSModal
        isVisible={props.modalVisible}
        onClose={() => props.setModalVisible(false)}
        onSelectAction={props.onSOSAction}
      />


    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F5F7FF' },
  hideCam: { height: 1, width: 1, opacity: 0, position: 'absolute' },
  header: {
    paddingTop: 55,
    paddingBottom: 28,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  headerStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  btnSection: { marginTop: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  safeCard: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 12,
  },
  safeIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  safeTextContainer: { flex: 1 },
  safeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  safeSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },

});