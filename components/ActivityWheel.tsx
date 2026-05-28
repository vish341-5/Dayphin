import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Activity } from '../types/activity';
import { calculateTrackedMinutesFromActivities, filterActivitiesToday } from '../utils/analytics';
import { getActivityColor } from '../utils/colors';
import { describeArc } from '../utils/svgArc';
import { timeToAngle } from '../utils/timeToAngle';

interface ActivityWheelProps {
  activities: Activity[];
  size?: number;
}

const STROKE_WIDTH = 18;

export default function ActivityWheel({ activities, size = 180 }: ActivityWheelProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const center = size / 2;

  const todaysActivities = useMemo(() => filterActivitiesToday(activities), [activities]);

  const wheelSegments = useMemo(() => {
    return todaysActivities
      .filter((activity) => activity.endTime > activity.startTime)
      .sort((a, b) => a.startTime - b.startTime)
        .map((activity) => ({
        id: activity.id,
        startAngle: timeToAngle(activity.startTime),
        endAngle: timeToAngle(activity.endTime),
        color: getActivityColor(activity.text),
      }));
  }, [todaysActivities]);

  const trackedMinutes = useMemo(
    () => calculateTrackedMinutesFromActivities(todaysActivities),
    [todaysActivities]
  );
  const trackedHours = Math.floor(trackedMinutes / 60);
  const trackedRemainingMinutes = trackedMinutes % 60;
  const trackedDurationLabel = `${trackedHours}h ${trackedRemainingMinutes}m`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {wheelSegments.map((segment) => (
          <Path
            key={segment.id}
            d={describeArc(center, center, radius, segment.startAngle, segment.endAngle)}
            stroke={segment.color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="butt"
            fill="none"
          />
        ))}
      </Svg>
      <View style={styles.centerContent}>
        <Text style={styles.centerLabel}>Tracked</Text>
        <Text style={styles.centerValue}>{trackedDurationLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  centerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
