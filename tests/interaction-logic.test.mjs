import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  matchesCapability,
  matchesCommand,
  matchesRepository,
  normalizeSearch,
} from "../src/scripts/filters.mjs";
import {
  describeThemePreference,
  normalizeThemePreference,
  resolveThemePreference,
} from "../src/scripts/theme.mjs";

test("theme preferences default to the system and resolve both automatic schemes", () => {
  assert.equal(normalizeThemePreference(null), "system");
  assert.equal(normalizeThemePreference("unsupported"), "system");
  assert.equal(normalizeThemePreference("system"), "system");
  assert.equal(normalizeThemePreference("light"), "light");
  assert.equal(normalizeThemePreference("dark"), "dark");

  assert.equal(resolveThemePreference("system", false), "light");
  assert.equal(resolveThemePreference("system", true), "dark");
});

test("explicit theme overrides ignore the system while status text stays descriptive", () => {
  assert.equal(resolveThemePreference("light", true), "light");
  assert.equal(resolveThemePreference("dark", false), "dark");
  assert.equal(
    describeThemePreference("system", "dark"),
    "Colour theme follows the system; currently dark.",
  );
  assert.equal(describeThemePreference("light", "light"), "Light colour theme selected.");
});

test("automatic mode subscribes to live system theme changes", () => {
  const siteScript = readFileSync(new URL("../src/scripts/site.ts", import.meta.url), "utf8");

  assert.match(siteScript, /systemTheme\.addEventListener\("change"/);
  assert.match(siteScript, /if \(themePreference === "system"\)/);
  assert.match(siteScript, /applyThemePreference\("system"\)/);
});

test("command matching is case-insensitive and supports multiple terms", () => {
  assert.equal(normalizeSearch("  C++ Systems  "), "c++ systems");
  assert.equal(matchesCommand("project source", "Project evidence repositories source"), true);
  assert.equal(matchesCommand("python mcp", "Python publication pipeline"), false);
  assert.equal(matchesCommand("", "Anything"), true);
});

test("capability filtering preserves the all view and exact groups", () => {
  assert.equal(matchesCapability("all", "architecture"), true);
  assert.equal(matchesCapability("delivery", "delivery"), true);
  assert.equal(matchesCapability("intelligence", "leadership"), false);
});

test("repository filtering combines text, ecosystem, tier, and technology", () => {
  const repository = {
    search: "OctoJoom Bash Docker Joomla deployment",
    owner: "OctoLeo Automation & Deployment",
    tier: "flagship",
    language: "Shell/Bash",
  };

  assert.equal(
    matchesRepository(
      {
        query: "bash deployment",
        owner: "OctoLeo Automation & Deployment",
        tier: "flagship",
        language: "Shell/Bash",
      },
      repository,
    ),
    true,
  );
  assert.equal(
    matchesRepository({ query: "python", owner: "all", tier: "all", language: "all" }, repository),
    false,
  );
  assert.equal(
    matchesRepository(
      { query: "", owner: "GetBible Scripture Platform", tier: "all", language: "all" },
      repository,
    ),
    false,
  );
});
