import { SOSButton } from '@/components/SOSButton';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { sendSOS } from '../services/api';

export default function HomeScreen() {
  const handleSOSPress = () => {
    // Calling the "Original Slot" we made for Rex/Allysa
    sendSOS({ latitude: 10.3157, longitude: 123.8854 }); 
    Alert.alert("Emergency", "SOS Slot Triggered! Check your VS Code Terminal.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>G!Track Emergency</Text>
      <SOSButton onPress={handleSOSPress} />
      <Text style={styles.footer}>Tap to Alert Admin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
  footer: { marginTop: 20, color: 'red' }
});