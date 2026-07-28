import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesCapability,
  matchesCommand,
  matchesRepository,
  normalizeSearch,
} from "../src/scripts/filters.mjs";

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

test("repository filtering combines text, estate, tier, and language", () => {
  const repository = {
    search: "OctoJoom Bash Docker Joomla deployment",
    owner: "octoleo",
    tier: "flagship",
    language: "Shell",
  };

  assert.equal(
    matchesRepository(
      { query: "bash deployment", owner: "octoleo", tier: "flagship", language: "Shell" },
      repository,
    ),
    true,
  );
  assert.equal(
    matchesRepository({ query: "python", owner: "all", tier: "all", language: "all" }, repository),
    false,
  );
  assert.equal(
    matchesRepository({ query: "", owner: "getbible", tier: "all", language: "all" }, repository),
    false,
  );
});
