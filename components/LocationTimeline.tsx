import { useMemo } from 'react';
import { Platform, SectionList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '../constants/theme';
import { LocationTimelineEntry } from '../hooks/useLocation';

interface Props {
  entries: LocationTimelineEntry[];
}

interface GroupedEntries {
  title: string;
  dateString: string;
  data: LocationTimelineEntry[];
}

export const LocationTimeline = ({ entries }: Props) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 36) : 44, 36);

  // Group and sort entries by date
  const groupedEntries: GroupedEntries[] = useMemo(() => {
    const groups: { [key: string]: { title: string; dateString: string; data: LocationTimelineEntry[] } } = {};
    
    // Sort entries descending by timestamp first (latest first)
    const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    sorted.forEach(entry => {
      const date = new Date(entry.timestamp);
      
      // Normalize to YYYY-MM-DD grouping key
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      if (!groups[key]) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        let title = '';
        if (date.toDateString() === today.toDateString()) {
          title = 'TODAY';
        } else if (date.toDateString() === yesterday.toDateString()) {
          title = 'YESTERDAY';
        } else {
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          title = days[date.getDay()];
        }
        
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        groups[key] = {
          title,
          dateString,
          data: []
        };
      }
      
      groups[key].data.push(entry);
    });
    
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => groups[key]);
  }, [entries]);

  const formatTimeText = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatLocationText = (item: LocationTimelineEntry) => {
    if (item.placeName) return item.placeName;
    
    const latStr = `${Math.abs(item.latitude).toFixed(4)}°${item.latitude >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(item.longitude).toFixed(4)}°${item.longitude >= 0 ? 'E' : 'W'}`;
    return `${latStr}, ${lonStr}`;
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: topInset + 16 }]}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerCategory}>G!TRACK HISTORY</Text>
          <Text style={styles.title}>Location Timeline</Text>
        </View>
        <View style={styles.headerIconCircle}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.subtitle}>Hourly location snapshots while tracking is active.</Text>
      
      {/* Tracking active status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Tracking active</Text>
        </View>
        <Text style={styles.snapshotsCount}>
          {entries.length} snapshot{entries.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: GroupedEntries }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionDate}>{section.dateString}</Text>
    </View>
  );

  const renderItem = ({ item, index, section }: { item: LocationTimelineEntry; index: number; section: GroupedEntries }) => {
    const sectionIndex = groupedEntries.findIndex(g => g.title === section.title);
    const isFirst = index === 0 && sectionIndex === 0;
    const isLast = index === section.data.length - 1 && sectionIndex === groupedEntries.length - 1;

    return (
      <View style={styles.itemRow}>
        {/* Left Track (Vertical line & timeline dots) */}
        <View style={styles.timelineTrack}>
          <View 
            style={[
              styles.timelineLine,
              isFirst && { top: '50%' },
              isLast && { bottom: '50%' }
            ]} 
          />
          <View style={styles.timelineDotOuter}>
            <View style={styles.timelineDotInner} />
          </View>
        </View>

        {/* Right Content Card */}
        <View style={styles.itemCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTime}>{formatTimeText(item.timestamp)}</Text>
            <View style={styles.hourlyPill}>
              <MaterialCommunityIcons name="broadcast" size={12} color="#1E2F97" style={styles.pillIcon} />
              <Text style={styles.pillText}>Hourly</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#F97316" style={styles.pinIcon} />
            <Text style={styles.cardLocation} numberOfLines={2}>
              {formatLocationText(item)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <>
          {renderHeader()}
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No location history yet.</Text>
            <Text style={styles.emptyHint}>The app will save an hourly snapshot as soon as the tracking service is active.</Text>
          </View>
        </>
      ) : (
        <SectionList
          sections={groupedEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
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
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#1E2F97',
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.extrabold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
    lineHeight: 18,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  snapshotsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  sectionDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: Typography.fontWeight.semibold,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  timelineTrack: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1E2F97',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginLeft: Spacing.xs,
    shadowColor: 'rgba(30, 47, 151, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 16,
    fontWeight: Typography.fontWeight.bold,
    color: '#0F172A',
  },
  hourlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: '#1E2F97',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  cardLocation: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.medium,
    color: '#64748B',
    lineHeight: 18,
    flex: 1,
  },
  emptyState: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F1F5F9',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    fontSize: Typography.fontSize.sm,
    color: '#64748B',
  },
  list: {
    paddingBottom: Spacing.xl,
  },
});
