import {
  format,
  formatDate,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  subDays,
  parseISO,
  isEqual,
} from "date-fns"

export function formatWorkoutDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  if (isToday(dateObj)) return "Today"
  if (isYesterday(dateObj)) return "Yesterday"
  return format(dateObj, "MMM d, yyyy")
}

export function formatShortDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "MMM d")
}

export function formatDay(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "EEEE")
}

export function isDateToday(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return isToday(dateObj)
}

export function getDateRange(days: number): { start: Date; end: Date } {
  const end = endOfDay(new Date())
  const start = startOfDay(subDays(end, days - 1))
  return { start, end }
}

export function groupWorkoutsByDate<T extends { date: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const date = item.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

export function sortDatesByRecent(dates: string[]): string[] {
  return dates.sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )
}

export function getTodayDate(): string {
  return formatDate(new Date(), "yyyy-MM-dd")
}

export function calculateStreak(
  dates: string[],
  referenceDate: Date = new Date()
): {
  current: number
  longest: number
  isAtRisk: boolean
} {
  if (dates.length === 0) {
    return { current: 0, longest: 0, isAtRisk: false }
  }

  const sortedDates = sortDatesByRecent(dates)
  const uniqueDates = Array.from(new Set(sortedDates))

  let current = 0
  let longest = 0
  let tempStreak = 0

  for (let i = 0; i < uniqueDates.length; i++) {
    const date = parseISO(uniqueDates[i])
    const prevDate = i > 0 ? parseISO(uniqueDates[i - 1]) : null

    if (i === 0) {
      const isToday = formatDate(date, "yyyy-MM-dd") === formatDate(referenceDate, "yyyy-MM-dd")
      const isYesterday = formatDate(date, "yyyy-MM-dd") === formatDate(subDays(referenceDate, 1), "yyyy-MM-dd")

      if (isToday || isYesterday) {
        tempStreak = 1
        if (isToday) current = 1
      } else {
        tempStreak = 0
      }
    } else {
      const daysDiff = Math.floor(
        (parseISO(uniqueDates[i - 1]).getTime() - date.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 1) {
        tempStreak += 1
      } else {
        tempStreak = 1
      }
    }

    longest = Math.max(longest, tempStreak)
  }

  current = Math.max(current, tempStreak)

  const today = formatDate(referenceDate, "yyyy-MM-dd")
  const lastWorkout = uniqueDates[0]
  const hasWorkoutToday = lastWorkout === today
  const hasWorkoutYesterday =
    lastWorkout === formatDate(subDays(referenceDate, 1), "yyyy-MM-dd")
  const isAtRisk = hasWorkoutYesterday && !hasWorkoutToday && current > 0

  return { current, longest, isAtRisk }
}
