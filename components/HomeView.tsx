import { CameraView } from 'expo-camera';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LocationCard } from './LocationCard';
import { SOSButton } from './SOSButton';
import { SOSModal } from './SOSModal';

const { width } = Dimensions.get('window');

export const HomeView = (props: any) => {
  return (
    <View style={styles.outer}>
      {/* Hidden Camera Component */}
      <CameraView 
        ref={props.cameraRef} 
        mode="video" 
        facing="front" 
        style={styles.hideCam} 
      />

      <ScrollView contentContainerStyle={styles.content}>
         <Text style={styles.title}>G!Track Dashboard</Text>
         
         {/* GPS COORDINATES CARD */}
         <LocationCard 
            location={props.location} 
            errorMsg={props.errorMsg} 
         />

         {/* RECTANGULAR SOS BUTTON AREA */}
         <View style={styles.rectangleBtnWrapper}>
            <SOSButton onPress={() => props.setModalVisible(true)} />
    
         </View>
      </ScrollView>

      {/* EMERGENCY SELECTION MODAL */}
      <SOSModal 
        isVisible={props.modalVisible} 
        onClose={() => props.setModalVisible(false)}
        onSelectAction={props.onSOSAction} 
      />

      {/* RECORDING INDICATOR */}
      {props.isRecording && (
        <View style={styles.recOverlay}>
          <Text style={styles.recText}>🔴 SECURE RECORDING ACTIVE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F5F6FA' },
  hideCam: { height: 1, width: 1, opacity: 0, position: 'absolute' },
  content: { 
    paddingTop: 60, 
    paddingBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#1E2F97', 
    marginBottom: 25,
    textAlign: 'center' 
  },
  rectangleBtnWrapper: { 
    marginTop: 30, 
    width: '100%', // Makes sure the rectangle can span the width
    alignItems: 'center' 
  },
  instruction: { 
    color: '#636E72', 
    fontSize: 14, 
    marginTop: 15,
    textAlign: 'center' 
  },
  recOverlay: { 
    position: 'absolute', 
    top: 50, 
    alignSelf: 'center', 
    backgroundColor: '#b42323', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 25,
    elevation: 5
  },
  recText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});