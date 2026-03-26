// components/LocationCard.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    // Professional Shadow for iOS/Android
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    backgroundColor: '#E6F0FF', // Light blue background for icon
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
  },
  coordLabel: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 10,
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D3436',
    letterSpacing: 0.5,
  },
});