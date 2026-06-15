import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

export const LocationCard = ({ location, errorMsg }: Props) => {
  const statusText = errorMsg ? 'GPS Error' : location ? 'GPS Active' : 'Acquiring GPS...';
  const statusColor = errorMsg ? '#EF4444' : location ? '#10B981' : '#F97316';
  const statusIcon = errorMsg 
    ? 'alert-circle' 
    : location 
      ? 'wifi' 
      : 'loading';

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="map-marker-outline" size={20} color="#1E2F97" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>CURRENT LOCATION</Text>
          <View style={styles.statusRow}>
            {statusIcon !== 'loading' ? (
              <MaterialCommunityIcons name={statusIcon as any} size={13} color={statusColor} style={styles.statusIcon} />
            ) : (
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            )}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.coordCol}>
          <Text style={styles.coordLabel}>LAT</Text>
          <Text style={styles.coordValue}>
            {location ? `${location.coords.latitude.toFixed(4)}°` : '—'}
          </Text>
        </View>
        <View style={styles.coordCol}>
          <Text style={styles.coordLabel}>LON</Text>
          <Text style={styles.coordValue}>
            {location ? `${location.coords.longitude.toFixed(4)}°` : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#EEF2FF',
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  coordCol: {
    alignItems: 'flex-end',
  },
  coordLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
});