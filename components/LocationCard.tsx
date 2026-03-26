// components/LocationCard.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Built-in icons
import * as Location from 'expo-location';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './LocationCard.styles'; // Import Rex's Styles

interface Props {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

export const LocationCard = ({ location, errorMsg }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          {/* Using the standard map marker icon */}
          <MaterialCommunityIcons name="map-marker-radius" size={24} color="#007AFF" />
        </View>
        <View>
          <Text style={styles.title}>Current Location</Text>
          <Text style={styles.subtitle}>
            {errorMsg ? 'GPS Error' : 'GPS Coordinates'}
          </Text>
        </View>
      </View>

      {errorMsg ? (
        <Text style={{ color: 'red' }}>{errorMsg}</Text>
      ) : location ? (
        <View>
          <Text style={styles.coordLabel}>Latitude</Text>
          <Text style={styles.coordValue}>
            {location.coords.latitude.toFixed(6)}°
          </Text>

          <Text style={styles.coordLabel}>Longitude</Text>
          <Text style={styles.coordValue}>
            {location.coords.longitude.toFixed(6)}°
          </Text>
        </View>
      ) : (
        <Text>Acquiring location...</Text>
      )}
    </View>
  );
};