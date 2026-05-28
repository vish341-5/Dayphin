import { PreviousDayData, Task } from '../types/activity';

/**
 * Service for fetching and managing previous day data
 * In production, this would connect to your backend API
 */

/**
 * Fetch previous days data from API
 * @param daysCount - Number of days to fetch (default: 7)
 * @returns Array of PreviousDayData
 */
export async function fetchPreviousDaysData(daysCount: number = 7): Promise<PreviousDayData[]> {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/activities/previous-days?count=${daysCount}`);
    // return response.json();

    // For now, returning mock data
    return generateMockPreviousDays(daysCount);
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
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/activities/day/${dateString}`);
    // return response.json();

    const date = new Date(dateString + 'T00:00:00');
    const tasks = generateMockTasks(date);
    const totalTimeSpent = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    return {
      date: dateString,
      tasks,
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        totalTimeSpent,
      },
    };
  } catch (error) {
    console.error('Failed to fetch day data:', error);
    return null;
  }
}

/**
 * Generate mock tasks for a given date.
 * @param date The date for which to generate tasks.
 * @returns An array of mock tasks.
 */
function generateMockTasks(date: Date): Task[] {
    return []
}


/**
 * Generate mock previous days data (for development)
 */
function generateMockPreviousDays(count: number): PreviousDayData[] {
  const days: PreviousDayData[] = [];
  const today = new Date();

  for (let i = 1; i <= count; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const tasks: Task[] = generateMockTasks(date)

    const totalTimeSpent = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    days.push({
      date: dateStr,
      tasks,
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        totalTimeSpent,
      },
    });
  }

  return days;
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
