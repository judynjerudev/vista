import { parseCalendarDate, toCalendarDate } from "@shared/calendarDate";

const formatDayMonthYear = (date: Date): string => {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDate = (isoDate: string): string => {
  return formatDayMonthYear(new Date(isoDate));
};

export const formatCalendarDate = (value: string): string => {
  const calendarDate = toCalendarDate(value);
  if (!calendarDate) {
    return "—";
  }
  return formatDayMonthYear(parseCalendarDate(calendarDate));
};

export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const elapsedMilliseconds = now.getTime() - date.getTime();

  if (elapsedMilliseconds < 0) {
    return formatDate(isoDate);
  }

  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedSeconds < 60) {
    return "Just now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }
  if (elapsedDays < 7) {
    return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
  }
  return formatDate(isoDate);
};
