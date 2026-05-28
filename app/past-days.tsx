import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ActivityWheel from '../components/ActivityWheel';
import { clearPastDaysData, fetchPreviousDaysData, forceArchiveToday, getDebugInfo, resetAndArchiveToday } from '../services/previousDayService';
import { Activity, PreviousDayData, Task } from '../types/activity';
import { getActivityColor } from '../utils/colors';

/**
 * Convert tasks to Activity format for the pie chart
 */
const tasksToActivities = (tasks: Task[]): Activity[] => {
  return tasks.map(task => ({
    id: task.id,
    text: task.category,
    startTime: task.startTime || 0,
    endTime: task.endTime || task.duration * 60 * 1000,
  }));
};

/**
 * Format date string to readable format
 */
const formatDateDisplay = (dateStr: string): { day: string; date: number; month: string; year: number } => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    day: days[date.getDay()],
    date: date.getDate(),
    month: months[date.getMonth()],
    year: date.getFullYear(),
  };
};

/**
 * Format time in milliseconds to HH:MM AM/PM
 */
const formatTime = (ms: number): string => {
  const date = new Date(ms);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

/**
 * Format duration in minutes to readable string
 */
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
};

export default function PastDaysScreen() {
  const [allDays, setAllDays] = useState<PreviousDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchPreviousDaysData(7);
      setAllDays(data);
      if (data.length > 0) {
        setSelectedDateIndex(0);
      }
      // Load debug info
      const info = await getDebugInfo();
      setDebugInfo(info);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleClearOldData = async () => {
    Alert.alert(
      'Clear Old Data',
      'This will remove all past days data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearPastDaysData();
            const data = await fetchPreviousDaysData(7);
            setAllDays(data);
            const info = await getDebugInfo();
            setDebugInfo(info);
          },
        },
      ]
    );
  };

  const handleForceArchive = async () => {
    Alert.alert(
      'Force Archive Today',
      'This will archive today\'s activities (if any) to past days',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            await forceArchiveToday();
            const data = await fetchPreviousDaysData(7);
            setAllDays(data);
            const info = await getDebugInfo();
            setDebugInfo(info);
            Alert.alert('Success', 'Today\'s activities have been archived');
          },
        },
      ]
    );
  };

  const handleShowDebugInfo = () => {
    const info = debugInfo;
    Alert.alert(
      'Debug Info',
      `Past Days Stored: ${info?.pastDaysCount || 0}\n` +
      `Dates: ${info?.pastDaysDates?.join(', ') || 'None'}\n` +
      `Current Activities: ${info?.currentActivitiesCount || 0}\n` +
      `Last Archived: ${info?.lastArchivedDate || 'Never'}`
    );
  };

  const handleResetAndArchive = async () => {
    Alert.alert(
      'Complete Reset',
      'This will clear all old data and archive today\'s activities fresh. Start completely clean from today.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAndArchiveToday();
            const data = await fetchPreviousDaysData(7);
            setAllDays(data);
            const info = await getDebugInfo();
            setDebugInfo(info);
            Alert.alert('Success', 'Complete reset done. Data is now clean from today.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Past Days</Text>
          <TouchableOpacity>
            <Ionicons name="calendar" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.emptyStateText}>Loading past activities...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Handle empty state
  if (!allDays || allDays.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Past Days</Text>
          <TouchableOpacity onPress={handleShowDebugInfo}>
            <Ionicons name="information-circle" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView}>
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No activity recorded</Text>
          </View>
          
          {/* Debug Panel */}
          <View style={styles.debugPanel}>
            <Text style={styles.debugTitle}>Debug Tools</Text>
            <Text style={styles.debugInfo}>Past Days: {debugInfo?.pastDaysCount || 0}</Text>
            <Text style={styles.debugInfo}>Current Activities: {debugInfo?.currentActivitiesCount || 0}</Text>
            
            <TouchableOpacity style={styles.debugButton} onPress={handleShowDebugInfo}>
              <Text style={styles.debugButtonText}>Show Debug Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.debugButton, styles.debugButtonWarning]} onPress={handleResetAndArchive}>
              <Text style={styles.debugButtonText}>⚡ Reset & Archive Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.debugButton} onPress={handleForceArchive}>
              <Text style={styles.debugButtonText}>Force Archive Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.debugButton, styles.debugButtonDanger]} onPress={handleClearOldData}>
              <Text style={styles.debugButtonText}>Clear All Old Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selectedDay = allDays[selectedDateIndex];
  const dateDisplay = formatDateDisplay(selectedDay.date);
  
  // Convert tasks to activities for the pie chart
  const activitiesForChart = useMemo(
    () => tasksToActivities(selectedDay.tasks),
    [selectedDay.tasks]
  );

  // Group tasks by category for legend
  const categorySummary = useMemo(() => {
    const grouped = new Map<string, { category: string; totalMinutes: number }>();
    selectedDay.tasks.forEach((task) => {
      const key = task.category.toLowerCase();
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        grouped.set(key, { category: task.category, totalMinutes: existing.totalMinutes + task.duration });
      } else {
        grouped.set(key, { category: task.category, totalMinutes: task.duration });
      }
    });
    return Array.from(grouped.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [selectedDay.tasks]);

  // Get the first and last task times for display
  const firstTaskTime = selectedDay.tasks.length > 0 && selectedDay.tasks[0].startTime ? selectedDay.tasks[0].startTime : 0;
  const lastTaskTime = selectedDay.tasks.length > 0 && selectedDay.tasks[selectedDay.tasks.length - 1].endTime ? selectedDay.tasks[selectedDay.tasks.length - 1].endTime : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Past Days</Text>
        <TouchableOpacity onPress={handleShowDebugInfo}>
          <Ionicons name="information-circle" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateScrollButton}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateList}
            contentContainerStyle={styles.dateListContent}
          >
            {allDays.map((day, idx) => {
              const dayDisplay = formatDateDisplay(day.date);
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.dateCard,
                    selectedDateIndex === idx && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDateIndex(idx)}
                >
                  <Text
                    style={[
                      styles.dateCardDay,
                      selectedDateIndex === idx && styles.dateCardDaySelected,
                    ]}
                  >
                    {dayDisplay.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateCardNumber,
                      selectedDateIndex === idx && styles.dateCardNumberSelected,
                    ]}
                  >
                    {dayDisplay.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.dateScrollButton}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <>
          {/* Empty Activities State */}
          {selectedDay.tasks.length === 0 ? (
            <View style={styles.emptyActivitiesState}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyActivitiesText}>No activities logged</Text>
            </View>
          ) : (
            <>
              {/* Analytics Card */}
              <View style={styles.analyticsCard}>
              <View style={styles.analyticsRight}>
                <ActivityWheel activities={activitiesForChart} size={200} />
                <Text style={styles.wheelTimeLabel}>{formatTime(lastTaskTime ??0)}</Text>
              </View>

              <View style={styles.analyticsLeft}>
                <Text style={styles.dateDisplayLabel}>
                  {dateDisplay.day}, {dateDisplay.date} {dateDisplay.month} {dateDisplay.year}
                </Text>
                <Text style={styles.timeLabel}>{formatTime(firstTaskTime)}</Text>

                <Text style={styles.totalTrackedLabel}>Total Tracked</Text>
                <Text style={styles.totalTrackedValue}>
                  {formatDuration(selectedDay.summary.totalTimeSpent)}
                </Text>

                <View style={styles.legendContainer}>
                  {categorySummary.map((item) => (
                    <View key={item.category} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: getActivityColor(item.category) },
                        ]}
                      />
                      <Text style={styles.legendLabel}>{item.category}</Text>
                      <Text style={styles.legendValue}>{item.totalMinutes}m</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="information-circle" size={14} color="#9CA3AF" />
            <Text style={styles.footerText}>All times are local to your device</Text>
          </View>
        </>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateScrollButton: {
    padding: 8,
  },
  dateList: {
    flex: 1,
    marginHorizontal: 8,
  },
  dateListContent: {
    gap: 10,
  },
  dateCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  dateCardSelected: {
    backgroundColor: '#1A1A1A',
  },
  dateCardDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateCardDaySelected: {
    color: '#FFFFFF',
  },
  dateCardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateCardNumberSelected: {
    color: '#FFFFFF',
  },
  analyticsCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  analyticsLeft: {
    width: '100%',
  },
  analyticsRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dateDisplayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  wheelTimeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  totalTrackedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  totalTrackedValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1A1A1A',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyActivitiesState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyActivitiesText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  debugPanel: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  debugInfo: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 4,
  },
  debugButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  debugButtonDanger: {
    backgroundColor: '#EF4444',
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});