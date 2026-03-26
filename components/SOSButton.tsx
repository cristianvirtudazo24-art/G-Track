import { Octicons } from '@expo/vector-icons'; // Using Octicons for the alert octagon
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onPress: () => void;
}

export const SOSButton = ({ onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* The Octagon Icon */}
      <View style={styles.iconContainer}>
        <Octicons name="alert" size={40} color="white" />
      </View>
      
      {/* Main SOS Text */}
      <Text style={styles.sosText}>SOS</Text>
      
      {/* Subtext description */}
      <Text style={styles.statusText}>Emergency & Safety Status</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F38181', // Matching the red/coral color from image_3.png
    width: '100%',
    paddingVertical: 35,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Slight shadow to make it pop like a card
    elevation: 8,
    shadowColor: '#F38181',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconContainer: {
    marginBottom: 15,
  },
  sosText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800', // Making it heavy and prominent
    letterSpacing: 2,
    marginBottom: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
  },
});