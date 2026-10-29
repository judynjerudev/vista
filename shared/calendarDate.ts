import { z } from "zod";

export type CalendarDate = string;

export const calendarDateSchema = z.iso.date({
  message: "Must be a calendar date in YYYY-MM-DD format",
});

export const toCalendarDate = (
  value: string | null | undefined,
): CalendarDate | null => {
  if (!value) {
    return null;
  }

  const datePart = value.slice(0, 10);
  const isDateOrTimestamp = value.length === 10 || value.charAt(10) === "T";
  if (!isDateOrTimestamp || !calendarDateSchema.safeParse(datePart).success) {
    return null;
  }
  return datePart;
};

export const parseCalendarDate = (value: CalendarDate): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
