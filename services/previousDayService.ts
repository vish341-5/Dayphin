import { Activity, PreviousDayData, Task } from '../types/activity';
import { clearActivities, getLastArchivedDate, loadActivities, loadPastDaysData, saveLastArchivedDate, savePastDaysData } from './storage';

/**
 * Service for fetching and managing previous day data
 * In production, this would connect to your backend API
 */

/**
 * Convert an Activity to a Task
 */
function activityToTask(activity: Activity): Task {
  const duration = Math.round((activity.endTime - activity.startTime) / (1000 * 60)); // convert ms to minutes
  
  return {
    id: activity.id,
    title: activity.text,
    category: 'Personal', // default category - could be enhanced with category tracking
    status: 'completed',
    duration,
    startTime: activity.startTime,
    endTime: activity.endTime,
  };
}

/**
 * Archive today's activities to past days storage
 * Call this when the app starts on a new day (or manually trigger it)
 */
export async function archiveTodayActivities(): Promise<void> {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"

    // Check if today is different from the last archived date
    const lastArchivedDate = await getLastArchivedDate();
    
    console.log('Archiving check:', {
      today: todayStr,
      lastArchivedDate: lastArchivedDate,
      shouldArchive: lastArchivedDate !== todayStr,
    });

    if (lastArchivedDate === todayStr) {
      // Already archived today
      console.log('Already archived for today, skipping');
      return;
    }

    // Load current activities
    const todayActivities = await loadActivities();
    
    console.log('Loaded activities for archiving:', {
      count: todayActivities.length,
      activities: todayActivities.map(a => ({ id: a.id, text: a.text })),
    });

    if (todayActivities.length === 0) {
      console.log('No activities to archive for today');
      // Still update the last archived date
      await saveLastArchivedDate(todayStr);
      return;
    }

    // Convert activities to tasks
    const tasks: Task[] = todayActivities.map(activityToTask);

    // Calculate summary
    const totalTimeSpent = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    // Create PreviousDayData object for today
    const todayData: PreviousDayData = {
      date: todayStr,
      tasks,
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        totalTimeSpent,
      },
    };

    // Load existing past days data
    const existingPastDays = await loadPastDaysData();

    // Check if today already exists in past days (avoid duplicates)
    const filteredPastDays = existingPastDays.filter(day => day.date !== todayStr);

    // Add today's data and keep the most recent days
    const updatedPastDays = [todayData, ...filteredPastDays].slice(0, 365); // Keep up to 1 year of data

    // Save back to storage
    await savePastDaysData(updatedPastDays);

    // Clear today's activities since we've archived them
    await clearActivities();

    // Save the last archived date
    await saveLastArchivedDate(todayStr);

    console.log('Successfully archived and cleared activities:', {
      date: todayStr,
      tasksArchived: tasks.length,
      totalPastDays: updatedPastDays.length,
    });
  } catch (error) {
    console.error('Failed to archive today activities:', error);
  }
}

/**
 * Fetch previous days data from storage
 * @param daysCount - Number of days to fetch (default: 7)
 * @returns Array of PreviousDayData
 */
export async function fetchPreviousDaysData(daysCount: number = 7): Promise<PreviousDayData[]> {
  try {
    const storedData = await loadPastDaysData();
    const slicedData = storedData.slice(0, daysCount);
    
    // Debug logging
    console.log('Fetching previous days data:', {
      storedDataCount: storedData.length,
      requestedCount: daysCount,
      returningCount: slicedData.length,
      dates: slicedData.map(d => d.date),
    });
    
    return slicedData;
  } catch (error) {
    console.error('Failed to fetch previous days data:', error);
    return [];
  }
}

/**
 * Fetch data for a specific date
 * @param dateString - Date in format "YYYY-MM-DD"
 * @returns PreviousDayData or null if not found
 */
export async function fetchDayData(dateString: string): Promise<PreviousDayData | null> {
  try {
    const storedData = await loadPastDaysData();
    return storedData.find(day => day.date === dateString) || null;
  } catch (error) {
    console.error('Failed to fetch day data:', error);
    return null;
  }
}


/**
 * Calculate activity statistics from tasks
 */
export function calculateActivityStats(tasks: Task[]) {
  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    skippedTasks: tasks.filter(t => t.status === 'skipped').length,
    totalTimeSpent: tasks.reduce((sum, t) => sum + t.duration, 0),
  };
}

/**
 * Group tasks by category
 */
export function groupTasksByCategory(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
}

/**
 * Debug function: Get all stored data
 */
export async function getDebugInfo(): Promise<{
  pastDaysCount: number;
  pastDaysDates: string[];
  currentActivitiesCount: number;
  lastArchivedDate: string | null;
}> {
  try {
    const pastDays = await loadPastDaysData();
    const currentActivities = await loadActivities();
    const lastArchivedDate = await getLastArchivedDate();

    return {
      pastDaysCount: pastDays.length,
      pastDaysDates: pastDays.map(d => d.date),
      currentActivitiesCount: currentActivities.length,
      lastArchivedDate,
    };
  } catch (error) {
    console.error('Error getting debug info:', error);
    return {
      pastDaysCount: 0,
      pastDaysDates: [],
      currentActivitiesCount: 0,
      lastArchivedDate: null,
    };
  }
}

/**
 * Clear all past days data (for testing/debugging)
 */
export async function clearPastDaysData(): Promise<void> {
  try {
    await savePastDaysData([]);
    console.log('Cleared all past days data');
  } catch (error) {
    console.error('Error clearing past days data:', error);
  }
}

/**
 * Manually force archiving (regardless of date)
 * Useful for testing the archiving mechanism
 */
export async function forceArchiveToday(): Promise<void> {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Load current activities
    const todayActivities = await loadActivities();

    console.log('Force archiving:', {
      date: todayStr,
      activitiesCount: todayActivities.length,
    });

    if (todayActivities.length === 0) {
      console.log('No activities to force archive');
      return;
    }

    // Convert activities to tasks
    const tasks: Task[] = todayActivities.map(activityToTask);

    // Calculate summary
    const totalTimeSpent = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    // Create PreviousDayData object for today
    const todayData: PreviousDayData = {
      date: todayStr,
      tasks,
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        totalTimeSpent,
      },
    };

    // Load existing past days data
    const existingPastDays = await loadPastDaysData();

    // Check if today already exists in past days (avoid duplicates)
    const filteredPastDays = existingPastDays.filter(day => day.date !== todayStr);

    // Add today's data and keep the most recent days
    const updatedPastDays = [todayData, ...filteredPastDays].slice(0, 365);

    // Save back to storage
    await savePastDaysData(updatedPastDays);

    // Clear today's activities since we've archived them
    await clearActivities();

    // Save the last archived date
    await saveLastArchivedDate(todayStr);

    console.log('Force archived successfully:', {
      date: todayStr,
      tasksArchived: tasks.length,
    });
  } catch (error) {
    console.error('Failed to force archive:', error);
  }
}

/**
 * Complete reset: Clear all old data and archive today fresh
 * Useful when you want to start clean from today
 */
export async function resetAndArchiveToday(): Promise<void> {
  try {
    console.log('Starting complete reset...');
    
    // Step 1: Clear all past days data
    await savePastDaysData([]);
    console.log('Cleared all past days data');
    
    // Step 2: Clear last archived date to force a fresh archive
    await saveLastArchivedDate('');
    console.log('Reset last archived date');
    
    // Step 3: Force archive today's activities
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayActivities = await loadActivities();
    
    if (todayActivities.length > 0) {
      // Convert activities to tasks
      const tasks: Task[] = todayActivities.map(activityToTask);
      
      // Calculate summary
      const totalTimeSpent = tasks.reduce((sum, t) => sum + t.duration, 0);
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      
      // Create PreviousDayData object for today
      const todayData: PreviousDayData = {
        date: todayStr,
        tasks,
        summary: {
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks,
          totalTimeSpent,
        },
      };
      
      // Save today's data to past days
      await savePastDaysData([todayData]);
      console.log('Archived today\'s activities:', {
        date: todayStr,
        tasksCount: tasks.length,
        totalTimeSpent,
      });
      
      // Clear today's activities for a fresh start
      await clearActivities();
    } else {
      console.log('No activities to archive for today');
    }
    
    // Save the last archived date
    await saveLastArchivedDate(todayStr);
    
    console.log('Complete reset finished successfully');
  } catch (error) {
    console.error('Failed to complete reset:', error);
  }
}
