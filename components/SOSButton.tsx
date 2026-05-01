import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';

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
    backgroundColor: '#DC2626', // Brighter red for SOS
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    backgroundColor: Colors.whiteAlpha[15],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.lg,
  },
  textContainer: { flex: 1 },
  sosText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.black,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  statusText: {
    color: Colors.whiteAlpha[85],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  chevron: { marginLeft: Spacing.xs },
});