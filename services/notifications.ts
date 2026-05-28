import Constants from 'expo-constants';
import { Platform } from 'react-native';

const REMINDER_TITLE = '🐬 Dolphin Tracker';
const REMINDER_BODY = 'What are you doing right now?';
const ANDROID_CHANNEL_ID = 'hourly-reminders';

let isHandlerConfigured = false;

const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

const getNotificationsModule = async () => {
  if (isExpoGoAndroid) {
    return null;
  }

  return import('expo-notifications');
};

const ensureAndroidChannel = async (Notifications: typeof import('expo-notifications')) => {
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Hourly Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  if (!isHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    isHandlerConfigured = true;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

const isReminderNotification = (notification: import('expo-notifications').NotificationRequest): boolean => {
  return (
    notification.content.title === REMINDER_TITLE &&
    notification.content.body === REMINDER_BODY
  );
};

export const scheduleRepeatingNotifications = async (): Promise<void> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  if (Platform.OS === 'android') {
    await ensureAndroidChannel(Notifications);
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hasReminder = scheduled.some(isReminderNotification);

  if (hasReminder) {
  await cancelNotifications();
}

  const trigger: import('expo-notifications').NotificationTriggerInput =
  Platform.OS === 'android'
    ? {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        minute: 0,
        second: 0,
        repeats: true,
        channelId: ANDROID_CHANNEL_ID,
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        minute: 0,
        second: 0,
        repeats: true,
      };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
    },
    trigger,
  });
};

export const cancelNotifications = async (): Promise<void> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const areReminderNotificationsEnabled = async (): Promise<boolean> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some(isReminderNotification);
};

export const enableReminderNotifications = async (): Promise<boolean> => {
  const isGranted = await requestNotificationPermissions();
  if (!isGranted) {
    return false;
  }

  await scheduleRepeatingNotifications();
  return true;
};

export const getReminderSupportMessage = (): string | null => {
  if (isExpoGoAndroid) {
    return 'Expo Go on Android does not support this notifications flow in SDK 53+. Use a development build.';
  }
  return null;
};
