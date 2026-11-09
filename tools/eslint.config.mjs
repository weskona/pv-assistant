// Undefined names in the frontend: the panel modules get their helpers through init(ctx), so a name that is forgotten there only
// fails when that code runs. `no-undef` finds it up front. Run from the repository root:
//   npx --yes eslint@9 -c tools/eslint.config.mjs custom_components/pv_assistant/frontend
const browser = Object.fromEntries(
  ["HTMLElement", "ResizeObserver", "URL", "cancelAnimationFrame", "clearInterval", "console", "customElements", "document", "localStorage",
   "performance", "requestAnimationFrame", "setInterval", "window", "setTimeout", "clearTimeout", "Event", "CustomEvent", "getComputedStyle"].map((n) => [n, "readonly"]),
);
export default [{ files: ["**/*.js"], languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: browser }, rules: { "no-undef": "error" } }];
