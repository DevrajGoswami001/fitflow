import { clsx, type ClassValue } from 'clsx';
import { format, isSameDay, parseISO, differenceInCalendarDays, startOfDay } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNullableString(value: string | null | undefined) {
  return value ?? null;
}

export function formatWorkoutDate(input: string | Date) {
  return format(typeof input === 'string' ? parseISO(input) : input, 'EEE, MMM d');
}

export function isTodayDate(input: string | Date) {
  return isSameDay(typeof input === 'string' ? parseISO(input) : input, new Date());
}

export function calculateStreak(workoutDates: string[]) {
  if (workoutDates.length === 0) return 0;
  const sortedDates = [...new Set(workoutDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const todayKey = new Date().toISOString().slice(0, 10);
  if (!sortedDates.some((date) => date.slice(0, 10) === todayKey)) return 0;

  let streak = 0;
  let anchor = startOfDay(new Date());

  for (const date of sortedDates) {
    const workoutDay = startOfDay(parseISO(date));
    const diff = differenceInCalendarDays(anchor, workoutDay);
    if (diff === 0 || diff === 1) {
      streak += 1;
      anchor = workoutDay;
      continue;
    }
    break;
  }

  return streak;
}

export function calculateCompletion(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

type WeeklyVolumeInput = {
  completed_at: string | null;
};

export function getWeeklyStreak(workouts: WeeklyVolumeInput[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  const completedDays = new Set(
    workouts
      .map((workout) => (workout.completed_at ? workout.completed_at.slice(0, 10) : ''))
      .filter(Boolean)
  );

  let runningStreak = 0;
  const processed = days.map((day) => {
    if (completedDays.has(day)) {
      runningStreak += 1;
    } else {
      runningStreak = 0;
    }

    return {
      date: format(parseISO(day), 'EEE'),
      streak: runningStreak
    };
  });

  console.debug('getWeeklyStreak: processed weekly data', processed);
  return processed;
}

export function formatWeight(value: number) {
  return `${value.toFixed(0)} lb`;
}
