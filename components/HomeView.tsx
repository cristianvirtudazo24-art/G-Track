import { CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlackoutButton } from './BlackoutButton';
import { BlackoutModal } from './BlackoutModal';
import { LocationCard } from './LocationCard';
import { SOSButton } from './SOSButton';
import { SOSModal } from './SOSModal';

const { width } = Dimensions.get('window');

export const HomeView = (props: any) => {
  return (
    <View style={styles.outer}>
      <CameraView
        ref={props.cameraRef}
        mode="video"
        facing="front"
        style={styles.hideCam}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back 👋</Text>
          <Text style={styles.headerTitle}>G!Track Dashboard</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#1E2F97" />
          <Text style={styles.headerBadgeText}>Active</Text>
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
          <BlackoutButton onPress={() => props.setBlackoutModalVisible(true)} />
        </View>
      </ScrollView>

      <SOSModal
        isVisible={props.modalVisible}
        onClose={() => props.setModalVisible(false)}
        onSelectAction={props.onSOSAction}
      />

      <BlackoutModal
        isVisible={props.blackoutModalVisible}
        onClose={() => props.setBlackoutModalVisible(false)}
        onSubmit={props.onBlackoutSubmit}
      />

      {props.isRecording && (
        <View style={styles.recOverlay}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>SECURE RECORDING ACTIVE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F5F7FF' },
  hideCam: { height: 1, width: 1, opacity: 0, position: 'absolute' },
  header: {
    backgroundColor: '#1E2F97',
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 2, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  headerBadgeText: { fontSize: 13, fontWeight: '700', color: '#1E2F97' },
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
  recOverlay: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
});