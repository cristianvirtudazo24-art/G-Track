import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';
import { LocationTimelineEntry } from '../hooks/useLocation';

interface Props {
  entries: LocationTimelineEntry[];
}

export const LocationTimeline = ({ entries }: Props) => {
  const renderItem = ({ item }: { item: LocationTimelineEntry }) => {
    const date = new Date(item.timestamp);
    const formattedTime = date.toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTime}>{formattedTime}</Text>
          <Text style={styles.itemLabel}>Hourly snapshot</Text>
        </View>
        <Text style={styles.itemCoords}>
          📍 {item.placeName || `Lat ${item.latitude.toFixed(5)} · Lon ${item.longitude.toFixed(5)}`}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Timeline</Text>
      <Text style={styles.subtitle}>Shows where you've been with hourly location snapshots while tracking is active.</Text>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No location history yet.</Text>
          <Text style={styles.emptyHint}>The app will save an hourly snapshot as soon as the tracking service is active.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing.md,
  },
  emptyState: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.slate[100],
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  itemCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemTime: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  itemLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  itemCoords: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});
