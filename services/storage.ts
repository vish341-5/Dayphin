import * as SecureStore from 'expo-secure-store';
import { Activity } from '../types/activity';

const STORAGE_KEY = 'dolphin-activities';
const ONE_HOUR_MS = 60 * 60 * 1000;

type StoredActivity = Partial<Activity> & {
  timestamp?: number;
};

const isSecureStoreAvailable = (): boolean => {
  return typeof SecureStore !== 'undefined' && typeof SecureStore.getItemAsync === 'function';
};

const normalizeActivity = (item: StoredActivity): Activity | null => {
  if (!item || typeof item.id !== 'string' || typeof item.text !== 'string') {
    return null;
  }

  if (typeof item.startTime === 'number' && typeof item.endTime === 'number') {
    return {
      id: item.id,
      text: item.text,
      startTime: item.startTime,
      endTime: item.endTime >= item.startTime ? item.endTime : item.startTime + ONE_HOUR_MS,
    };
  }

  if (typeof item.timestamp === 'number') {
    return {
      id: item.id,
      text: item.text,
      startTime: item.timestamp,
      endTime: item.timestamp + ONE_HOUR_MS,
    };
  }

  return null;
};

/**
 * Save activities array to secure storage
 */
export const saveActivities = async (activities: Activity[]): Promise<void> => {
  try {
    if (!isSecureStoreAvailable()) {
      console.warn('SecureStore not available, data will not persist');
      return;
    }

    const jsonString = JSON.stringify(activities);
    await SecureStore.setItemAsync(STORAGE_KEY, jsonString, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED
    });
  } catch (error) {
    console.error('Error saving activities:', error);
    // Don't rethrow - allow app to continue
  }
};

/**
 * Load activities array from secure storage
 */
export const loadActivities = async (): Promise<Activity[]> => {
  try {
    if (!isSecureStoreAvailable()) {
      console.warn('SecureStore not available');
      return [];
    }

    const jsonString = await SecureStore.getItemAsync(STORAGE_KEY);

    if (!jsonString) {
      return [];
    }

    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeActivity(item as StoredActivity))
      .filter((item): item is Activity => item !== null);
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
};

/**
 * Clear all activities from secure storage
 */
export const clearActivities = async (): Promise<void> => {
  try {
    if (!isSecureStoreAvailable()) {
      console.warn('SecureStore not available');
      return;
    }

    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing activities:', error);
    // Don't rethrow - allow app to continue
  }
};
