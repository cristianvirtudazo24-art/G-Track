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
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#E8313A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    marginBottom: 14,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  sosText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 3,
  },
  statusText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  chevron: { marginLeft: 8 },
});