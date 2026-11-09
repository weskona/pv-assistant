// Unit tests of the pure helpers of the panel: node --test tests/js
import assert from "node:assert/strict";
import { test } from "node:test";
import { simulateStorage } from "../../custom_components/pv_assistant/frontend/pv-assistant-analysis.js";

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
