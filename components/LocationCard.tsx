import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React from 'react';
import { Text, View } from 'react-native';
import { Colors, Typography } from '../constants/theme';
import { styles } from './LocationCard.styles';

interface Props {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

export const LocationCard = ({ location, errorMsg }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="map-marker-radius" size={22} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>Current Location</Text>
          <Text style={styles.subtitle}>
            {errorMsg ? 'GPS Error' : location ? 'GPS Active' : 'Acquiring GPS...'}
          </Text>
        </View>
      </View>

      {errorMsg ? (
        <Text style={{ color: Colors.danger, fontSize: Typography.fontSize.sm }}>{errorMsg}</Text>
      ) : location ? (
        <View style={styles.coordRow}>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <Text style={styles.coordValue}>{location.coords.latitude.toFixed(5)}°</Text>
          </View>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>Longitude</Text>
            <Text style={styles.coordValue}>{location.coords.longitude.toFixed(5)}°</Text>
          </View>
        </View>
      ) : (
        <Text style={{ color: Colors.text.muted, fontSize: Typography.fontSize.sm }}>Acquiring location...</Text>
      )}
    </View>
  );
};