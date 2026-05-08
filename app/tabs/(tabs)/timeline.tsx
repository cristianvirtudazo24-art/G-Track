import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { LocationTimeline } from '../../../components/LocationTimeline';
import { Colors } from '../../../constants/theme';
import { useLocation } from '../../../hooks/useLocation';

export default function TimelineScreen() {
  const { timeline } = useLocation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LocationTimeline entries={timeline} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flex: 1 },
});
