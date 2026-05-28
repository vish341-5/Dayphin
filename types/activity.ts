export interface Activity {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
}

export type TaskStatus = 'completed' | 'pending' | 'skipped';

export interface Task {
    id: string;
    title: string;
    category: string;
    status: TaskStatus;
    duration: number; // minutes spent
    startTime?: number; // optional timestamp for timeline display
    endTime?: number; // optional timestamp for timeline display
}

export interface DaySummary {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalTimeSpent: number; // minutes
}

export interface PreviousDayData {
    date: string; // e.g., "2026-05-27"
    tasks: Task[];
    summary: DaySummary;
}