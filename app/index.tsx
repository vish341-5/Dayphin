import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActivityWheel from '../components/ActivityWheel';
import {
    areReminderNotificationsEnabled,
    enableReminderNotifications,
    getReminderSupportMessage,
} from '../services/notifications';
import { loadActivities, saveActivities } from '../services/storage';
import { Activity } from '../types/activity';
import { formatDurationLabel, generateActivitySummaryData } from '../utils/analytics';
import { getActivityColor } from '../utils/colors';
import { formatTime, getMinutesUntilNextCheckIn, getNextCheckInTime } from '../utils/time';

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
    position: 'relative',
  },
  heroTextContainer: {
    flex: 1,
    zIndex: 0,
    paddingRight: 100,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  greetingEmoji: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 20,
    zIndex: 0,
  },
  dolphinImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    position: 'absolute',
    right: 20,
    top: 4,
    zIndex: 2,
  },
  nextCheckInCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  clockIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E0F0FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '500',
    fontSize: 24,
  },
  nextCheckInContent: {
    flex: 1,
  },
  nextCheckInLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  nextCheckInTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  nextCheckInIn: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  logActivityButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  logActivityButtonIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  logActivityButtonText: {
    flex: 1,
  },
  logActivityButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  logActivityButtonSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    fontWeight: '400',
  },
  logActivityButtonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  reminderCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reminderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  reminderButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reminderButtonDisabled: {
    opacity: 0.7,
  },
  reminderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reminderEnabledText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  reminderStatusText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  timelineSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  timelineViewAll: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clearLogsButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearLogsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  timelineContainer: {
    gap: 1,
  },
  timelinePreviewClipped: {
    maxHeight: 250,
    overflow: 'hidden',
  },
  timelineItemWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineConnector: {
    width: 2,
    height: 44,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineActivity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  timelineDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 'auto',
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  glanceSection: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  glanceSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  glanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  glanceChartContainer: {
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  glanceLegend: {
    width: '100%',
    gap: 8,
  },
  glanceLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glanceLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  glanceLegendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  glanceLegendLabelMuted: {
    color: '#6B7280',
  },
  glanceLegendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  glanceLegendValueMuted: {
    color: '#6B7280',
  },
  glancePie: {
    fontSize: 80,
    marginBottom: 12,
    color: '#9CA3AF',
  },
  glanceEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  glanceEmptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  motivationalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  motivationalEmoji: {
    fontSize: 40,
  },
  motivationalText: {
    flex: 1,
  },
  motivationalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  motivationalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  motivationalHeart: {
    fontSize: 20,
    color: '#EC4899',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontWeight: '400',
    marginBottom: 16,
  },
  inputFieldFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  timePickerButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  timePickerButtonText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  timePickerPlaceholderText: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  validationText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 12,
    fontWeight: '500',
  },
  iosPickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  iosPickerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalButtonContainer: {
    gap: 12,
  },
  timelineModalContent: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  timelineModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  timelineModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  timelineModalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  timelineModalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});

type PickerTarget = 'start' | 'end';
const TIMELINE_PREVIEW_COUNT = 4;

const calculateDuration = (startTime: number, endTime: number): string => {
  const durationMs = Math.max(0, endTime - startTime);
  const totalMinutes = Math.round(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const normalizeToToday = (value: Date): Date => {
  const date = new Date();
  date.setHours(value.getHours(), value.getMinutes(), 0, 0);
  return date;
};

// Home Screen Component
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activityText, setActivityText] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosPickerTarget, setIosPickerTarget] = useState<PickerTarget | null>(null);
  const [iosPickerValue, setIosPickerValue] = useState(new Date());
  const [timelineModalVisible, setTimelineModalVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [notificationStatusMessage, setNotificationStatusMessage] = useState('');
  const reminderSupportMessage = getReminderSupportMessage();

  // Load activities from secure storage on mount
  useEffect(() => {
    const initializeActivities = async () => {
      try {
        const loadedActivities = await loadActivities();
        setActivities(loadedActivities);
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    };

    initializeActivities();
  }, []);

  useEffect(() => {
    const syncNotificationState = async () => {
      try {
        const enabled = await areReminderNotificationsEnabled();
        setNotificationsEnabled(enabled);
      } catch (error) {
        console.error('Failed to read notification status:', error);
      }
    };

    syncNotificationState();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const resetModalFields = useCallback(() => {
    setActivityText('');
    setStartTime(null);
    setEndTime(null);
    setValidationMessage('');
    setInputFocused(false);
    setIosPickerVisible(false);
    setIosPickerTarget(null);
  }, []);

  const getPickerDate = useCallback((target: PickerTarget): Date => {
    const selectedTime = target === 'start' ? startTime : endTime;
    return selectedTime ? new Date(selectedTime) : new Date();
  }, [endTime, startTime]);

  const applySelectedTime = useCallback((target: PickerTarget, selectedDate: Date) => {
    const timestamp = normalizeToToday(selectedDate).getTime();
    if (target === 'start') {
      setStartTime(timestamp);
    } else {
      setEndTime(timestamp);
    }
  }, []);

  const openTimePicker = useCallback((target: PickerTarget) => {
    setValidationMessage('');

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'time',
        is24Hour: false,
        value: getPickerDate(target),
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) {
            return;
          }
          applySelectedTime(target, selectedDate);
        },
      });
      return;
    }

    setIosPickerTarget(target);
    setIosPickerValue(getPickerDate(target));
    setIosPickerVisible(true);
  }, [applySelectedTime, getPickerDate]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetModalFields();
  }, [resetModalFields]);

  const handleClearAllLogs = useCallback(() => {
    setActivities([]);
    saveActivities([]).catch((error) => {
      console.error('Failed to clear activities:', error);
    });
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    try {
      if (reminderSupportMessage) {
        setNotificationStatusMessage(reminderSupportMessage);
        return;
      }

      setIsEnablingNotifications(true);
      setNotificationStatusMessage('');
      const enabled = await enableReminderNotifications();
      setNotificationsEnabled(enabled);

      if (!enabled) {
        setNotificationStatusMessage('Notification permission is required to enable reminders.');
      }
    } catch (error) {
      console.error('Failed to enable reminders:', error);
      setNotificationStatusMessage('Unable to enable reminders right now. Please try again.');
    } finally {
      setIsEnablingNotifications(false);
    }
  }, [reminderSupportMessage]);

  const handleLogActivity = useCallback(() => {
    const trimmedText = activityText.trim();

    if (!trimmedText) {
      setValidationMessage('Please enter an activity name.');
      return;
    }

    if (startTime === null || endTime === null) {
      setValidationMessage('Please select both start and end time.');
      return;
    }

    if (endTime < startTime) {
      setValidationMessage('End time must be later than start time.');
      return;
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      text: trimmedText,
      startTime,
      endTime,
    };

    setActivities((prev) => {
      const updatedActivities = [newActivity, ...prev];
      // Persist to secure storage
      saveActivities(updatedActivities).catch((error) => {
        console.error('Failed to save activities:', error);
      });
      return updatedActivities;
    });
    setModalVisible(false);
    resetModalFields();
  }, [activityText, endTime, resetModalFields, startTime]);

  const hasActivities = activities.length > 0;
  const hasMoreThanPreview = activities.length > TIMELINE_PREVIEW_COUNT;
  const previewActivities = useMemo(
    () => activities.slice(0, TIMELINE_PREVIEW_COUNT),
    [activities]
  );
  const analyticsData = useMemo(() => generateActivitySummaryData(activities), [activities]);
  const nextCheckInTime = useMemo(() => getNextCheckInTime(currentTime), [currentTime]);
  const minutesUntilNextCheckIn = useMemo(
    () => getMinutesUntilNextCheckIn(currentTime, nextCheckInTime),
    [currentTime, nextCheckInTime]
  );
  const renderTimelineItem = useCallback(
    ({ item, index, totalItems }: { item: Activity; index: number; totalItems: number }) => {
      return (
        <View>
          <View style={styles.timelineItemWrapper}>
            <View
              style={[
                styles.timelineMarker,
                { backgroundColor: getActivityColor(item.text) },
              ]}
            />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>
                {`${formatTime(item.startTime)} - ${formatTime(item.endTime)}`}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.timelineActivity}>{item.text}</Text>
                <Text style={styles.timelineDuration}>
                  {calculateDuration(item.startTime, item.endTime)}
                </Text>
              </View>
            </View>
          </View>
          {index < totalItems - 1 ? (
            <View style={styles.timelineConnector} />
          ) : null}
        </View>
      );
    },
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* Hero Section - Side by Side */}
          <View style={[styles.heroSection, { paddingTop: insets.top + 4 }]}>
            <View style={styles.heroTextContainer}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">Hey there!</Text>
              </View>
              <Text style={styles.subtitle} numberOfLines={2}>
                Let&apos;s track your time and make every hour count.
              </Text>
            </View>
            <Image
              source={require('../assets/images/dolphin.png')}
              style={styles.dolphinImage}
            />
          </View>

          {/* Next Check-in Card (only when user has logged at least one activity) */}
          {hasActivities && (
            <View style={styles.nextCheckInCard}>
              <View style={styles.clockIcon}>
                <Text style={styles.nextCheckInIn}>🕐</Text>
              </View>
              <View style={styles.nextCheckInContent}>
                <Text style={styles.nextCheckInLabel}>Next check-in</Text>
                <Text style={styles.nextCheckInTime}>{formatTime(nextCheckInTime.getTime())}</Text>
                <Text style={styles.nextCheckInIn}>in {minutesUntilNextCheckIn} min</Text>
              </View>
            </View>
          )}

          {/* Log Activity Button */}
          <TouchableOpacity
            style={styles.logActivityButton}
            activeOpacity={0.85}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.logActivityButtonIcon}>+</Text>
            <View style={styles.logActivityButtonText}>
              <Text style={styles.logActivityButtonTitle}>
                Log What You&apos;re Doing
              </Text>
              <Text style={styles.logActivityButtonSubtitle}>
                Tap to log your current activity
              </Text>
            </View>
            <Text style={styles.logActivityButtonArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>Hourly Reminders</Text>
            <Text style={styles.reminderSubtitle}>
              Stay aware of where your time goes.
            </Text>
            {notificationsEnabled ? (
              <Text style={styles.reminderEnabledText}>✅ Hourly reminders enabled</Text>
            ) : (
              <TouchableOpacity
                style={[
                  styles.reminderButton,
                  isEnablingNotifications ? styles.reminderButtonDisabled : null,
                ]}
                onPress={handleEnableNotifications}
                activeOpacity={0.85}
                disabled={isEnablingNotifications || Boolean(reminderSupportMessage)}
              >
                <Text style={styles.reminderButtonText}>
                  {isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                </Text>
              </TouchableOpacity>
            )}
            {notificationStatusMessage ? (
              <Text style={styles.reminderStatusText}>{notificationStatusMessage}</Text>
            ) : reminderSupportMessage ? (
              <Text style={styles.reminderStatusText}>{reminderSupportMessage}</Text>
            ) : null}
          </View>

          {/* Timeline Section */}
          {hasActivities ? (
            <View style={styles.timelineSection}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineSectionTitle}>Today&apos;s Timeline</Text>
                {hasMoreThanPreview ? (
                  <TouchableOpacity
                    onPress={() => setTimelineModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.timelineViewAll}>View All</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View
                style={[
                  styles.timelineCard,
                  styles.timelineContainer,
                  hasMoreThanPreview ? styles.timelinePreviewClipped : null,
                ]}
              >
                <FlatList
                  data={previewActivities}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) =>
                    renderTimelineItem({ item, index, totalItems: previewActivities.length })
                  }
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
              <TouchableOpacity
                style={styles.clearLogsButton}
                onPress={handleClearAllLogs}
                activeOpacity={0.8}
              >
                <Text style={styles.clearLogsButtonText}>Clear All Logs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timelineSection}>
              <Text style={styles.timelineSectionTitle}>Today</Text>
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateTitle}>
                  No activities logged yet
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start logging your activities to see your timeline here.
                </Text>
              </View>
            </View>
          )}

          {/* Today at a Glance Section */}
          <View style={styles.glanceSection}>
            <Text style={styles.glanceSectionTitle}>Today at a Glance</Text>
            {hasActivities ? (
              <View style={styles.glanceCard}>
                <View style={styles.glanceChartContainer}>
                  <ActivityWheel activities={activities} size={180} />
                </View>
                <View style={styles.glanceLegend}>
                  {analyticsData.segments.map((segment) => (
                    <View key={segment.label} style={styles.glanceLegendRow}>
                      <View
                        style={[
                          styles.glanceLegendDot,
                          { backgroundColor: segment.color },
                        ]}
                      />
                      <Text
                        style={styles.glanceLegendLabel}
                      >
                        {segment.label}
                      </Text>
                      <Text style={styles.glanceLegendValue}>
                        {formatDurationLabel(segment.minutes)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.glanceCard}>
                <Ionicons
                  name="pie-chart-outline"
                  size={72}
                  color="#9CA3AF"
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.glanceEmptyTitle}>No data to show</Text>
                <Text style={styles.glanceEmptySubtitle}>
                  Your time insights and analytics will appear here.
                </Text>
              </View>
            )}
          </View>

          {/* Motivational Message */}
          <View style={styles.motivationalContainer}>
            <Text style={styles.motivationalEmoji}>🐬</Text>
            <View style={styles.motivationalText}>
              <Text style={styles.motivationalTitle}>
                One check-in at a time.
              </Text>
              <Text style={styles.motivationalSubtitle}>
                You&apos;ve got this!
              </Text>
            </View>
            <Text style={styles.motivationalHeart}>❤️</Text>
          </View>
        </ScrollView>

        <Modal
          visible={timelineModalVisible}
          animationType="slide"
          onRequestClose={() => setTimelineModalVisible(false)}
        >
          <View style={styles.timelineModalContent}>
            <View style={[styles.timelineModalHeader, { paddingTop: insets.top + 8 }]}>
              <Text style={styles.timelineModalTitle}>Today&apos;s Timeline</Text>
              <TouchableOpacity
                onPress={() => setTimelineModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.timelineModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timelineModalBody}>
              <View style={[styles.timelineCard, styles.timelineContainer]}>
                <FlatList
                  data={activities}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) =>
                    renderTimelineItem({ item, index, totalItems: activities.length })
                  }
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Activity Logger Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={{ flex: 1 }}
              onPress={closeModal}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Log Your Activity</Text>
              <Text style={styles.inputLabel}>Activity Name</Text>
              <TextInput
                style={[
                  styles.inputField,
                  inputFocused && styles.inputFieldFocused,
                ]}
                placeholder="Enter activity..."
                placeholderTextColor="#D1D5DB"
                value={activityText}
                onChangeText={setActivityText}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                maxLength={50}
                returnKeyType="done"
                autoFocus={true}
              />
              <Text style={styles.inputLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => openTimePicker('start')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timePickerButtonText,
                    startTime === null && styles.timePickerPlaceholderText,
                  ]}
                >
                  {startTime === null ? 'Select Time' : formatTime(startTime)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>End Time</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => openTimePicker('end')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timePickerButtonText,
                    endTime === null && styles.timePickerPlaceholderText,
                  ]}
                >
                  {endTime === null ? 'Select Time' : formatTime(endTime)}
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && iosPickerVisible && iosPickerTarget && (
                <View style={styles.iosPickerContainer}>
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    value={iosPickerValue}
                    onChange={(_, selectedDate) => {
                      if (selectedDate) {
                        setIosPickerValue(selectedDate);
                      }
                    }}
                  />
                  <View style={styles.iosPickerActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setIosPickerVisible(false);
                        setIosPickerTarget(null);
                      }}
                    >
                      <Text style={styles.iosPickerActionText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (iosPickerTarget) {
                          applySelectedTime(iosPickerTarget, iosPickerValue);
                        }
                        setIosPickerVisible(false);
                        setIosPickerTarget(null);
                      }}
                    >
                      <Text style={styles.iosPickerActionText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {validationMessage ? (
                <Text style={styles.validationText}>{validationMessage}</Text>
              ) : null}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleLogActivity}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>Add Activity</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
