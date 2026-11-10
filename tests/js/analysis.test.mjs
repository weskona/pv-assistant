// Unit tests of the pure helpers of the panel: node --test tests/js
import assert from "node:assert/strict";
import { test } from "node:test";
import { simulateStorage, suddenDrops } from "../../custom_components/pv_assistant/frontend/pv-assistant-analysis.js";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("without a storage the surplus is fed in and the deficit is bought", () => {
  const { imp, feed } = simulateStorage([[5, 1], [0, 2], [3, 3]], 0);
  near(imp, 2); near(feed, 4);
});

test("a storage shifts the surplus to the deficit", () => {
  const { imp, feed } = simulateStorage([[5, 1], [0, 2]], 10, 1);
  near(imp, 0); near(feed, 0); // 4 kWh are stored, 2 kWh are drawn, 2 kWh stay in the storage
});

test("the capacity limits what is stored", () => {
  const { imp, feed } = simulateStorage([[10, 0], [0, 10]], 3, 1);
  near(feed, 7); near(imp, 7);
});

test("losses: only the efficiency share comes back", () => {
  const { imp } = simulateStorage([[4, 0], [0, 4]], 10, 0.81); // sqrt = 0.9 on the way in and out
  near(imp, 4 - 4 * 0.81);
});

test("energy is conserved: production + import = consumption + feed-in + stored energy", () => {
  const hours = [[3, 1], [0, 2], [6, 2], [1, 4], [0, 1]];
  const { imp, feed } = simulateStorage(hours, 2, 1);
  const p = hours.reduce((a, [x]) => a + x, 0), h = hours.reduce((a, [, x]) => a + x, 0);
  assert.ok(p + imp + 1e-9 >= h + feed - 2 - 1e-9 && p + imp <= h + feed + 2 + 1e-9);
});

const plantDays = (name, perDay) => ({ name, spec: new Map(perDay.map((v, i) => [`2026-06-${String(i + 1).padStart(2, "0")}`, v])) });

test("a plant that drops against the others over the last days is found", () => {
  const sunny = [4, 5, 5, 3, 6, 5, 4, 5, 6, 5, 4, 5];
  const a = plantDays("A", sunny), b = plantDays("B", sunny);
  const c = plantDays("C", sunny.map((v, i) => (i >= 9 ? v * 0.5 : v))); // C loses half of its yield on the last 3 days
  const drops = suddenDrops([a, b, c]);
  assert.equal(drops.length, 1);
  assert.equal(drops[0].name, "C");
  near(Math.round(drops[0].pct), 50);
});

test("no drop when all plants follow the weather together, and too little history is ignored", () => {
  const sunny = [4, 5, 5, 3, 6, 5, 4, 5, 6, 5, 4, 5];
  assert.deepEqual(suddenDrops([plantDays("A", sunny), plantDays("B", sunny.map((v) => v * 0.8))]), []);
  assert.deepEqual(suddenDrops([plantDays("A", [5, 5, 5, 5]), plantDays("B", [5, 5, 5, 1])]), []);
  assert.deepEqual(suddenDrops([plantDays("A", sunny)]), []);
});

import { toCsv } from "../../custom_components/pv_assistant/frontend/pv-assistant-report.js";

test("the CSV uses ; as separator, a dot as decimal separator and quotes where needed", () => {
  const text = toCsv(["Month", "Name; with", "Value"], [["2026-06", 'a "b"', 12.34567], ["2026-07", null, NaN]]);
  assert.equal(text, 'Month;"Name; with";Value\r\n2026-06;"a ""b""";12.346\r\n2026-07;;');
});

test("a power limit slows charging and discharging", () => {
  // 10 kWh surplus in one hour, 10 kWh deficit in the next: with 2 kW only 2 kWh can be stored and 2 kWh drawn
  const { imp, feed } = simulateStorage([[10, 0], [0, 10]], 100, 1, 2);
  near(feed, 8); near(imp, 8);
  const free = simulateStorage([[10, 0], [0, 10]], 100, 1);
  near(free.feed, 0); near(free.imp, 0);
});
