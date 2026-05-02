import { describe, expect, it } from "vitest";
import { addDays, isValidIsoDate, mondayOf, todayIso, weekDates } from "./dates";

describe("dates", () => {
  it("formats today as YYYY-MM-DD", () => {
    expect(todayIso(new Date(2026, 4, 2))).toBe("2026-05-02");
  });

  it("validates ISO date strings strictly", () => {
    expect(isValidIsoDate("2026-05-02")).toBe(true);
    expect(isValidIsoDate("2026-13-02")).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-5-2")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns Monday for any day in the week", () => {
    // 2026-05-02 is a Saturday; Monday of that week is 2026-04-27.
    expect(mondayOf("2026-05-02")).toBe("2026-04-27");
    // 2026-05-03 is a Sunday; same Monday.
    expect(mondayOf("2026-05-03")).toBe("2026-04-27");
    // Monday returns itself.
    expect(mondayOf("2026-04-27")).toBe("2026-04-27");
  });

  it("returns 7 consecutive dates for a week", () => {
    expect(weekDates("2026-04-27")).toEqual([
      "2026-04-27",
      "2026-04-28",
      "2026-04-29",
      "2026-04-30",
      "2026-05-01",
      "2026-05-02",
      "2026-05-03",
    ]);
  });
});
