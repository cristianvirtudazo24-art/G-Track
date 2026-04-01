// components/LocationCard.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#1E2F97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 14,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  coordBox: {
    flex: 1,
    backgroundColor: '#F5F7FF',
    borderRadius: 14,
    padding: 14,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  coordValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2F97',
    letterSpacing: 0.3,
  },
});