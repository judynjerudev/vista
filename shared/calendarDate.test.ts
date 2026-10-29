import { describe, expect, it } from "vitest";

import {
  calendarDateSchema,
  parseCalendarDate,
  toCalendarDate,
} from "./calendarDate.js";

describe("calendarDateSchema", () => {
  it("accepts a YYYY-MM-DD date", () => {
    expect(calendarDateSchema.safeParse("2026-03-18").success).toBe(true);
  });

  it.each(["2026-03-18T00:00:00.000Z", "2026-02-30", "18/03/2026", ""])(
    "rejects %j",
    (value) => {
      expect(calendarDateSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe("toCalendarDate", () => {
  it("keeps a calendar date unchanged", () => {
    expect(toCalendarDate("2026-03-18")).toBe("2026-03-18");
  });

  it("takes the date part of an ISO timestamp as written", () => {
    expect(toCalendarDate("2026-03-18T00:00:00.000Z")).toBe("2026-03-18");
    expect(toCalendarDate("2026-03-18T23:30:00+05:00")).toBe("2026-03-18");
  });

  it.each([
    null,
    undefined,
    "",
    "not a date",
    "2026-02-30",
    "2026-03-18 10:00",
  ])("returns null for %j", (value) => {
    expect(toCalendarDate(value)).toBeNull();
  });
});

describe("parseCalendarDate", () => {
  it("returns local midnight on that day", () => {
    const date = parseCalendarDate("2026-03-18");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(18);
    expect(date.getHours()).toBe(0);
  });
});
