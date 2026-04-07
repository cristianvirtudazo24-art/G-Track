import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onPress: () => void;
}

export const SOSButton = ({ onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconContainer}>
        <Octicons name="alert" size={36} color="white" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.sosText}>SOS</Text>
        <Text style={styles.statusText}>Tap to report an emergency</Text>
      </View>
      <View style={styles.chevron}>
        <Octicons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8313A',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E8313A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  sosText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 1,
  },
  statusText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: { marginLeft: 6 },
});