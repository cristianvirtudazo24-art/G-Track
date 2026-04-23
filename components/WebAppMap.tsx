import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewProps {
  style?: any;
  url: string;
}

export const WebAppMap = ({ style, url }: MapViewProps) => {
  if (Platform.OS === 'web') {
    // Fast path for Expo Web testing
    const iframe = React.createElement('iframe', {
      src: url,
      style: { width: '100%', height: '100%', border: 'none' },
    });
    return <View style={[styles.container, style]}>{iframe}</View>;
  }

  // Native iOS/Android WebView
  return (
    <View style={[styles.container, style]}>
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
