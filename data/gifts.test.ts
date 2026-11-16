import assert from "node:assert/strict";
import { describe, it } from "node:test";
// Node's strip-types runner needs the .ts specifier; the app tsconfig rejects it.
// @ts-expect-error TS5097 -- allowImportingTsExtensions is intentionally off.
import { giftByDay, gifts } from "./gifts.ts";

const KINDS = new Set(["messaggio", "attivita", "promessa", "sorpresa"]);

describe("gifts", () => {
  it("lists days 1 through 24 once each", () => {
    assert.equal(gifts.length, 24);
    const days = gifts.map((gift) => gift.day).sort((a, b) => a - b);
    assert.deepEqual(
      days,
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
  });

  it("uses a valid kind and non-empty title, body, and sticker", () => {
    for (const gift of gifts) {
      assert.equal(KINDS.has(gift.kind), true);
      assert.notEqual(gift.title.trim(), "");
      assert.notEqual(gift.body.trim(), "");
      assert.notEqual(gift.sticker.trim(), "");
    }
  });

  it("looks up a day and misses unknown days", () => {
    const first = giftByDay(1);
    assert.ok(first);
    assert.equal(first.day, 1);
    assert.equal(giftByDay(99), undefined);
  });
});
