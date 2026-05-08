import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';

export const styles = StyleSheet.create<{
  card: ViewStyle;
  headerRow: ViewStyle;
  iconContainer: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  coordRow: ViewStyle;
  coordBox: ViewStyle;
  coordLabel: TextStyle;
  coordValue: TextStyle;
}>({
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    width: '100%',
    ...Shadows.md,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  coordBox: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  coordValue: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
});