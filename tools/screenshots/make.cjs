// Creates the screenshots of all tabs in English and German with sample data (see mock.js).
//
//   cd tools/screenshots && npm install playwright && node make.cjs      (needs a Chromium: npx playwright install chromium)
//   MOBILE=1 node make.cjs                                  (phone width, images land in docs/screenshots/mobile)
//   TABS=now,balance node make.cjs                         (only these tabs, the file numbers stay the same)
//   PLAYWRIGHT_PATH=/path/to/playwright CHROMIUM=/path/to/chromium node make.cjs     (use an installed copy instead)
//
// The real panel files are loaded in a browser with a fake Home Assistant behind them, the images land in docs/screenshots/{en,de}.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");

const root = path.resolve(__dirname, "../..");
const frontend = path.join(root, "custom_components/pv_assistant/frontend");
// MOBILE=1: a phone viewport (390 px wide) into docs/screenshots/mobile; OUT_DIR=<dir> writes somewhere else (to look at the result first)
const MOBILE = !!process.env.MOBILE;
const ONLY = process.env.TABS ? process.env.TABS.split(",") : null; // e.g. TABS=now,balance: only these tabs
const outDir = process.env.OUT_DIR || path.join(root, "docs/screenshots", MOBILE ? "mobile" : "");
const NOW = new Date("2026-06-18T14:30:00+02:00"); // a sunny afternoon, the images always show the same moment
const LONG_RANGE = new Set(["plants", "storage"]);
const FILE_NAMES = { now: "now", power: "power", plants: "plants", analysis: "analysis", history: "history", balance: "balance", consumption: "consumption", storage: "storage", forecast: "forecast", money: "economics", years: "yearly", scenarios: "scenarios", settings: "settings" };

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  :root { --primary-text-color:#e1e1e1; --secondary-text-color:#9b9b9b; --primary-color:#03a9f4; --text-primary-color:#fff;
          --card-background-color:#1c1c1c; --secondary-background-color:#202020; --primary-background-color:#111111;
          --divider-color:rgba(225,225,225,.12); --ha-card-border-radius:12px; color-scheme:dark; }
  body { margin:0; background:#111; color:#e1e1e1; font-family:Roboto,"Helvetica Neue",Arial,sans-serif; }
  pv-assistant-panel { display:block; }
</style></head><body></body></html>`;

(async () => {
  const written = [];
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const lang of ["en", "de"]) {
    const context = await browser.newContext({ viewport: MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 900 }, deviceScaleFactor: MOBILE ? 2 : 1, isMobile: MOBILE, hasTouch: MOBILE, locale: lang === "de" ? "de-DE" : "en-GB", timezoneId: "Europe/Berlin" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.clock.setFixedTime(NOW);
    await page.route("http://x.test/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/") return route.fulfill({ body: PAGE, contentType: "text/html" });
      if (url.pathname === "/mock.js") return route.fulfill({ path: path.join(__dirname, "mock.js"), contentType: "text/javascript" });
      if (url.pathname.startsWith("/pv_assistant_static/")) return route.fulfill({ path: path.join(frontend, path.basename(url.pathname)), contentType: "text/javascript" });
      return route.fulfill({ status: 404, body: "" });
    });
    await page.goto("http://x.test/");
    await page.evaluate(async ({ lang, nowMs }) => {
      await import("/pv_assistant_static/pv-assistant-panel.js?v=s");
      const { setupMock } = await import("/mock.js");
      const { hass } = await setupMock({ lang, nowMs, analysisUrl: "/pv_assistant_static/pv-assistant-analysis.js?v=s" });
      const el = document.createElement("pv-assistant-panel");
      document.body.append(el);
      window.__el = el;
      el.hass = hass;
    }, { lang, nowMs: NOW.getTime() });
    await page.waitForFunction(() => window.__el?._tabs?.length >= 10, null, { timeout: 60000 });
    const tabs = await page.evaluate(() => window.__el._tabs.map(([, section, id]) => [section, id]));
    fs.mkdirSync(path.join(outDir, lang), { recursive: true });
    let n = 0;
    for (const [section, id] of tabs) {
      n++;
      if (ONLY && !ONLY.includes(id)) continue;
      await page.evaluate((id) => window.__el._showTab(id, false), id);
      if (id === "settings") { // open the first plant and its sensors so that the module strings and the compass show
        await page.evaluate(() => { const r = window.__el._root; const plant = r.querySelector("#setsec details.plant"); if (plant) { plant.open = true; plant.querySelectorAll("details").forEach((d) => { d.open = true; }); } });
      }
      const settled = (section) => { const r = window.__el._root; return !r.querySelector(`#${section} .chart.loading`) && !r.getElementById(section).hidden; };
      await page.waitForFunction(settled, section, { timeout: 60000 });
      if (LONG_RANGE.has(id)) { // these tabs show more with a year of data than with their default range
        await page.evaluate((section) => { const q = window.__el._root.querySelector(`#${section} .pk-quick`); q.value = "y12"; q.dispatchEvent(new Event("change")); }, section);
        await page.waitForTimeout(300);
        await page.waitForFunction(settled, section, { timeout: 60000 });
      }
      await page.waitForTimeout(id === "now" ? 1800 : 900); // charts draw, the flow animation runs
      const file = path.join(outDir, lang, `${String(n).padStart(2, "0")}-${FILE_NAMES[id] || id}.png`);
      await page.screenshot({ path: file, fullPage: true });
      written.push(file);
      console.log(lang, file);
    }
    if (errors.length) console.log(`${lang}: errors\n${[...new Set(errors)].join("\n")}`);
    await context.close();
  }
  await browser.close();
  // palette images are a fraction of the size and look the same for flat dark UIs
  try { execFileSync("python3", ["-I", path.join(__dirname, "optimize.py"), outDir, ...written], { stdio: "inherit" }); } catch (e) { console.log("optimize.py skipped"); }
})();
