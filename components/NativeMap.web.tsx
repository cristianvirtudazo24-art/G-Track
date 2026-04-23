import React from 'react';
import { View, Text } from 'react-native';

export const MapView = ({ children, style }: any) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' }]}>
    <Text style={{ color: '#6b7280' }}>Map is not supported on the Web preview</Text>
    <View style={{ display: 'none' }}>{children}</View>
  </View>
);

export const Marker = ({ children, coordinate }: any) => <View>{children}</View>;

export const Callout = ({ children }: any) => <View>{children}</View>;

export default MapView;
