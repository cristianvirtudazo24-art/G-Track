import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MapViewProps {
  style?: any;
  url: string;
}

export const WebAppMap = ({ style }: MapViewProps) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.message}>This screen is only available on mobile devices.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    color: '#374151',
    textAlign: 'center',
    fontSize: 16,
  },
});
