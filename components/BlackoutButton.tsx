import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onPress: () => void;
}

export const BlackoutButton = ({ onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="lightning-bolt" size={28} color="#F97316" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>Blackout Alert</Text>
        <Text style={styles.subText}>Notify admin of power loss</Text>
      </View>
      <View style={styles.chevron}>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  iconContainer: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  titleText: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  subText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '400',
  },
  chevron: { marginLeft: 8 },
});
