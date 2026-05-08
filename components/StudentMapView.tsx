import * as Location from 'expo-location';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Colors } from '../constants/theme';

interface StudentMapViewProps {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

export const StudentMapView = ({ location, errorMsg }: StudentMapViewProps) => {
  // Default to San Francisco if location not available
  const initialRegion = useMemo(() => {
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }, [location]);

  if (errorMsg || !location) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {errorMsg || '📍 Acquiring location...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description={`Lat: ${location.coords.latitude.toFixed(5)}, Lon: ${location.coords.longitude.toFixed(5)}`}
            pinColor={Colors.primary}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 14,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
