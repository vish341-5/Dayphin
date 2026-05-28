import { Activity } from '../types/activity';

const MINUTES_IN_MS = 60000;

import { getActivityColor } from './colors';
const UNTRACKED_COLOR = '#D1D5DB';

export interface AnalyticsSegment {
  label: string;
  minutes: number;
  chartValue: number;
  color: string;
  isUntracked?: boolean;
}

interface GroupedActivity {
  label: string;
  minutes: number;
}

export interface ActivitySummaryItem {
  label: string;
  minutes: number;
  color: string;
}

const normalizeLabelKey = (label: string): string => label.trim().toLowerCase();

// Use shared color utility for consistent activity colors across the app
export const getActivityColorForLabel = (label: string): string => getActivityColor(label);

export const groupActivitiesByType = (activities: Activity[]): Map<string, GroupedActivity> => {
  const grouped = new Map<string, GroupedActivity>();

  activities.forEach((activity) => {
    const label = activity.text.trim();
    if (!label) {
      return;
    }
    const durationMinutes = Math.max(0, Math.round((activity.endTime - activity.startTime) / MINUTES_IN_MS));
    if (durationMinutes <= 0) {
      return;
    }

    const normalizedKey = normalizeLabelKey(label);
    const existing = grouped.get(normalizedKey);
    if (existing) {
      grouped.set(normalizedKey, {
        label: existing.label,
        minutes: existing.minutes + durationMinutes,
      });
      return;
    }

    grouped.set(normalizedKey, { label, minutes: durationMinutes });
  });

  return grouped;
};

export const calculateTrackedMinutes = (groupedActivities: Map<string, GroupedActivity>): number => {
  return Array.from(groupedActivities.values()).reduce((sum, activity) => sum + activity.minutes, 0);
};

export const calculateTrackedMinutesFromActivities = (activities: Activity[]): number => {
  return activities.reduce((sum, activity) => {
    const durationMinutes = Math.max(0, Math.round((activity.endTime - activity.startTime) / MINUTES_IN_MS));
    return sum + durationMinutes;
  }, 0);
};

export const calculateUntrackedMinutes = (trackedMinutes: number, now: Date = new Date()): number => {
  const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, elapsedMinutesToday - trackedMinutes);
};

export const filterActivitiesToday = (activities: Activity[], now: Date = new Date()): Activity[] => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  return activities.filter((a) => a && typeof a.startTime === 'number' && a.startTime >= startOfToday.getTime() && a.startTime < endOfToday.getTime());
};

export const formatDurationLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
};

export const generatePieChartData = (
  activities: Activity[],
  now: Date = new Date()
): {
  segments: AnalyticsSegment[];
  trackedMinutes: number;
  untrackedMinutes: number;
  elapsedMinutes: number;
} => {
  const todaysActivities = filterActivitiesToday(activities, now);
  const groupedActivities = groupActivitiesByType(todaysActivities);
  const trackedMinutes = calculateTrackedMinutes(groupedActivities);
  const elapsedMinutes = now.getHours() * 60 + now.getMinutes();
  const untrackedMinutes = calculateUntrackedMinutes(trackedMinutes, now);
  const chartScale = trackedMinutes > elapsedMinutes && trackedMinutes > 0
    ? elapsedMinutes / trackedMinutes
    : 1;

  const activitySegments: AnalyticsSegment[] = Array.from(groupedActivities.values())
    .sort((a, b) => b.minutes - a.minutes)
    .map(({ label, minutes }) => ({
      label,
      minutes,
      chartValue: Math.max(0, minutes * chartScale),
      color: getActivityColorForLabel(label),
    }));

  const segments = untrackedMinutes > 0
    ? [
        ...activitySegments,
        {
          label: 'Untracked',
          minutes: untrackedMinutes,
          chartValue: Math.max(0, untrackedMinutes * chartScale),
          color: UNTRACKED_COLOR,
          isUntracked: true,
        },
      ]
    : activitySegments;

  return {
    segments,
    trackedMinutes,
    untrackedMinutes,
    elapsedMinutes,
  };
};

export const generateActivitySummaryData = (
  activities: Activity[],
  now: Date = new Date()
): {
  segments: ActivitySummaryItem[];
  trackedMinutes: number;
} => {
  const todaysActivities = filterActivitiesToday(activities, now);
  const groupedActivities = groupActivitiesByType(todaysActivities);
  const segments = Array.from(groupedActivities.values())
    .sort((a, b) => b.minutes - a.minutes)
    .map(({ label, minutes }) => ({
      label,
      minutes,
      color: getActivityColorForLabel(label),
    }));

  return {
    segments,
    trackedMinutes: calculateTrackedMinutes(groupedActivities),
  };
};
