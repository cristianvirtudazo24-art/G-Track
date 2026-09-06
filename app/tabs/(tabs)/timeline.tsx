import { StyleSheet, View } from 'react-native';
import { LocationTimeline } from '../../../components/LocationTimeline';
import { useLocation } from '../../../hooks/useLocation';

export default function TimelineScreen() {
  const { timeline } = useLocation();

  return (
    <View style={styles.container}>
      <LocationTimeline entries={timeline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

