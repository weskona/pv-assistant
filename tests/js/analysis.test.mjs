// Unit tests of the pure helpers of the panel: node --test tests/js
import assert from "node:assert/strict";
import { test } from "node:test";
import { bestPayback, recommend, simulateStorage, suddenDrops } from "../../custom_components/pv_assistant/frontend/pv-assistant-analysis.js";

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

import * as scenariosTab from "../../custom_components/pv_assistant/frontend/pv-assistant-tab-scenarios.js";
import { simulateStorage as simulate } from "../../custom_components/pv_assistant/frontend/pv-assistant-analysis.js";

// two identical days: 4 kWh of production per hour from 10 to 13 o'clock, a consumption of 0.5 kWh in every hour
function scenarioPart() {
  scenariosTab.init({ esc: (s) => s, mergedRows: () => [], categoryBarChart: () => {}, localKeyFn: () => () => ({}), simulateStorage: simulate });
  const part = new scenariosTab.ScenariosPart();
  const hod = [], hours = [];
  for (let d = 0; d < 2; d++) for (let h = 0; h < 24; h++) { hod.push(h); hours.push([h >= 10 && h <= 13 ? 4 : 0, 0.5]); }
  part._scn = { hours, hod, nDays: 2, pImp: 0.3, pFeed: 0.1, peakKwp: 5 };
  return part;
}
const state = { cap: 0, power: 0, eff: 100, price: 0, pv: 0, pvprice: 0, load: 0, from: 10, len: 4 };

test("scenario: an extra load at noon is covered by PV, in the evening it comes from the grid", () => {
  const part = scenarioPart();
  const noon = part._simMetrics({ ...state, load: 8, from: 10, len: 4 }); // 2 kWh per hour on top of 0.5, the PV makes 4
  near(noon.extraPv, 100);
  near(noon.extraCost / noon.extraYear, 0.1); // PV covers it, so it only costs the feed-in tariff that is lost
  const evening = part._simMetrics({ ...state, load: 8, from: 18, len: 4 });
  near(evening.extraPv, 0);
  assert.ok(evening.extraCost / evening.extraYear > noon.extraCost / noon.extraYear); // a kWh in the evening costs more
  near(evening.extraCost / evening.extraYear, 0.3); // the grid price
});

test("scenario: more production raises the benefit, a storage covers the evening", () => {
  const part = scenarioPart();
  const plain = part._simMetrics(state);
  near(plain.benefit, 0);
  const more = part._simMetrics({ ...state, pv: 50 });
  assert.ok(more.benefit > 0 && more.feed > plain.feed);
  const stored = part._simMetrics({ ...state, cap: 5 });
  assert.ok(stored.benefit > 0 && stored.autarky > plain.autarky);
  // the investment: 5 kWh at 700 plus 50 % of 5 kWp at 900
  near(part._simMetrics({ ...state, cap: 5, price: 700, pv: 50, pvprice: 900 }).investment, 5 * 700 + 2.5 * 900);
});

test("the best option is the one with the shortest payback, options without a gain are ignored", () => {
  const best = bestPayback([{ id: "a", gain: 100, invest: 3000 }, { id: "b", gain: 200, invest: 4000 }, { id: "c", gain: 0, invest: 100 }, { id: "d", gain: 50, invest: 0 }]);
  assert.equal(best.id, "b");
  near(best.payback, 20);
  assert.equal(bestPayback([{ gain: -5, invest: 100 }]), null);
  assert.equal(bestPayback([]), null);
});

test("recommend: the shorter payback wins, an option over the limit does not count", () => {
  assert.equal(recommend({ payback: 12 }, { payback: 8 }), "pv");
  assert.equal(recommend({ payback: 8 }, { payback: 12 }), "storage");
  assert.equal(recommend({ payback: 30 }, { payback: 9 }), "pv");
  assert.equal(recommend({ payback: 30 }, { payback: 40 }), "none");
  assert.equal(recommend(null, { payback: 20 }), "pv");
  assert.equal(recommend(null, null), "none");
});

test("scenario: the investment and the gain count only what is added to the existing storage", () => {
  const part = scenarioPart();
  part._scn.usableNow = 3; // a storage of 3 kWh exists
  const same = part._simMetrics({ ...state, cap: 3, price: 700 });
  near(same.gain, 0); near(same.investment, 0);
  const more = part._simMetrics({ ...state, cap: 5, price: 700 });
  near(more.investment, 2 * 700); // only the 2 added kWh
  const cap3 = part._simMetrics({ ...state, cap: 3 }), cap5 = part._simMetrics({ ...state, cap: 5 });
  near(more.gain, cap5.benefit - cap3.benefit); // against today's storage, not against none
  assert.ok(more.benefit > more.gain);
  part._scn.usableNow = 0;
  const none = part._simMetrics({ ...state, cap: 5, price: 700 });
  near(none.investment, 5 * 700); near(none.gain, none.benefit);
});
