import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  doorState,
  isToday,
  isUnlocked,
  parseSimDate,
  unlockLabel,
} from "./unlock.ts";

describe("isUnlocked", () => {
  it("opens door 1 just after local midnight on 1 December 2026", () => {
    assert.equal(isUnlocked(1, new Date(2026, 11, 1, 0, 1)), true);
  });

  it("keeps a later door locked on 1 December 2026", () => {
    assert.equal(isUnlocked(2, new Date(2026, 11, 1, 23, 59)), false);
  });

  it("opens door 24 at local midnight on 24 December 2026", () => {
    assert.equal(isUnlocked(24, new Date(2026, 11, 24, 0, 0)), true);
  });

  it("locks every door before December 2026", () => {
    assert.equal(isUnlocked(1, new Date(2026, 10, 30)), false);
  });

  it("keeps past December doors open through the end of 2026", () => {
    assert.equal(isUnlocked(5, new Date(2026, 11, 31)), true);
  });

  it("unlocks every door from 2027 onward", () => {
    assert.equal(isUnlocked(5, new Date(2027, 0, 1)), true);
  });

  it("locks every door in years before 2026", () => {
    assert.equal(isUnlocked(5, new Date(2025, 11, 25)), false);
  });

  it("rejects days outside 1 through 24", () => {
    const now = new Date(2026, 11, 24, 12, 0);
    assert.equal(isUnlocked(0, now), false);
    assert.equal(isUnlocked(25, now), false);
  });
});

describe("isToday", () => {
  it("is true only on that exact December 2026 day", () => {
    assert.equal(isToday(3, new Date(2026, 11, 3)), true);
    assert.equal(isToday(3, new Date(2026, 11, 4)), false);
    assert.equal(isToday(3, new Date(2027, 11, 3)), false);
  });
});

describe("doorState", () => {
  it("matches the unlock and today cases", () => {
    assert.equal(doorState(1, new Date(2026, 11, 1, 0, 1)), "today");
    assert.equal(doorState(2, new Date(2026, 11, 1, 23, 59)), "locked");
    assert.equal(doorState(24, new Date(2026, 11, 24, 0, 0)), "today");
    assert.equal(doorState(1, new Date(2026, 10, 30)), "locked");
    assert.equal(doorState(5, new Date(2026, 11, 31)), "available");
    assert.equal(doorState(5, new Date(2027, 0, 1)), "available");
    assert.equal(doorState(5, new Date(2025, 11, 25)), "locked");
    assert.equal(doorState(0, new Date(2026, 11, 24)), "locked");
    assert.equal(doorState(25, new Date(2026, 11, 24)), "locked");
    assert.equal(doorState(3, new Date(2026, 11, 3)), "today");
    assert.equal(doorState(3, new Date(2026, 11, 4)), "available");
    assert.equal(doorState(3, new Date(2027, 11, 3)), "available");
  });
});

describe("unlockLabel", () => {
  it("formats the Italian day label", () => {
    assert.equal(unlockLabel(1), "1 dicembre");
    assert.equal(unlockLabel(24), "24 dicembre");
  });
});

describe("parseSimDate", () => {
  it("returns local noon for a real calendar day", () => {
    const parsed = parseSimDate("2026-12-03");
    assert.ok(parsed);
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 11);
    assert.equal(parsed.getDate(), 3);
    assert.equal(parsed.getHours(), 12);
    assert.equal(parsed.getMinutes(), 0);
    assert.equal(parsed.getSeconds(), 0);
  });

  it("rejects impossible dates and non YYYY-MM-DD strings", () => {
    assert.equal(parseSimDate("2026-02-31"), null);
    assert.equal(parseSimDate("nope"), null);
  });
});
