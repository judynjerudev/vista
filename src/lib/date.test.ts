import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { formatCalendarDate } from "./date";

describe("formatCalendarDate", () => {
  beforeAll(() => {
    vi.stubEnv("TZ", "America/Los_Angeles");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("shows the same calendar day in a timezone behind UTC", () => {
    expect(formatCalendarDate("2026-03-18")).toBe("18 Mar 2026");
  });

  it("shows the calendar day of a timestamp as written", () => {
    expect(formatCalendarDate("2026-03-18T00:00:00.000Z")).toBe("18 Mar 2026");
  });

  it("shows a dash for a value that isn't a date", () => {
    expect(formatCalendarDate("not a date")).toBe("—");
  });
});
