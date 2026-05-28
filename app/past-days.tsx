import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ActivityWheel from '../components/ActivityWheel';
import { Activity, PreviousDayData, Task } from '../types/activity';
import { getActivityColor } from '../utils/colors';

/**
 * Mock data generator - In production, this would fetch from API
 * Generates data for the past 7 days
 */
const generateMockDays = (): PreviousDayData[] => {
  const days: PreviousDayData[] = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const baseTime = date.getTime();
    const tasks: Task[] = [
      {
        id: `${dateStr}-1`,
        title: 'Coding',
        category: 'Work',
        status: 'completed',
        duration: 150,
        startTime: baseTime + 9.5 * 60 * 60 * 1000,
        endTime: baseTime + 12 * 60 * 60 * 1000,
      },
      {
        id: `${dateStr}-2`,
        title: 'Study',
        category: 'Study',
        status: 'completed',
        duration: 105,
        startTime: baseTime + 13.5 * 60 * 60 * 1000,
        endTime: baseTime + 15.25 * 60 * 60 * 1000,
      },
      {
        id: `${dateStr}-3`,
        title: 'Workout',
        category: 'Health',
        status: 'completed',
        duration: 60,
        startTime: baseTime + 17.5 * 60 * 60 * 1000,
        endTime: baseTime + 18.5 * 60 * 60 * 1000,
      },
      {
        id: `${dateStr}-4`,
        title: 'Reading',
        category: 'Study',
        status: 'completed',
        duration: 45,
        startTime: baseTime + 20 * 60 * 60 * 1000,
        endTime: baseTime + 20.75 * 60 * 60 * 1000,
      },
    ];

    const totalTimeSpent = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    days.push({
      date: dateStr,
      tasks,
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks: 0,
        totalTimeSpent,
      },
    });
  }

  return days;
};

/**
 * Fetch previous day data (in production, call your API here)
 */
const getPreviousDayData = (): PreviousDayData[] => {
  return generateMockDays();
};

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

/**
 * Activity Icon Component
 */
const ActivityIcon = ({ category }: { category: string }) => {
  const categoryMap: Record<string, { icon: string; bgColor: string }> = {
    Work: { icon: 'code-slash', bgColor: '#E0F2FE' },
    Study: { icon: 'book', bgColor: '#E0F0FF' },
    Health: { icon: 'barbell', bgColor: '#FEF3E2' },
    Personal: { icon: 'document-text', bgColor: '#FEF3E2' },
  };

  const { icon, bgColor } = categoryMap[category] || { icon: 'checkmark-circle', bgColor: '#F0F0F0' };

  return (
    <View style={[styles.activityIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={getActivityColor(category)} />
    </View>
  );
};

export default function PastDaysScreen() {
  const [allDays] = useState<PreviousDayData[]>(getPreviousDayData());
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Handle empty state
  if (!allDays || allDays.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Past Days</Text>
          <TouchableOpacity>
            <Ionicons name="calendar" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No activity recorded</Text>
        </View>
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
        <TouchableOpacity>
          <Ionicons name="calendar" size={24} color="#1A1A1A" />
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
                <Text style={styles.wheelTimeLabel}>{formatTime(lastTaskTime)}</Text>
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

            {/* Activities List Section */}
            <View style={styles.activitiesSection}>
              <View style={styles.activitiesSectionHeader}>
                <Text style={styles.activitiesSectionTitle}>Activities</Text>
                <Text style={styles.totalTimeLabel}>Total Time</Text>
              </View>

              <View style={styles.activitiesListContainer}>
                {selectedDay.tasks.map((task, idx) => (
                  <TouchableOpacity key={task.id} style={styles.activityListItem}>
                    <ActivityIcon category={task.category} />
                    <View style={styles.activityListContent}>
                      <Text style={styles.activityListName}>{task.title}</Text>
                      {task.startTime && task.endTime && (
                        <Text style={styles.activityListTime}>
                          {formatTime(task.startTime)} — {formatTime(task.endTime)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.activityListDuration}>
                      {formatDuration(task.duration)}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
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
  activitiesSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 24,
  },
  activitiesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activitiesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalTimeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activitiesListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityListContent: {
    flex: 1,
  },
  activityListName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  activityListTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  activityListDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
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
});
