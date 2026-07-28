import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profile = JSON.parse(readFileSync(new URL("../src/data/profile.json", import.meta.url)));
const projects = JSON.parse(readFileSync(new URL("../src/data/projects.json", import.meta.url)));
const repositories = JSON.parse(
  readFileSync(new URL("../src/data/repositories.json", import.meta.url)),
);
const projectIds = new Set(projects.map((project) => project.id));

test("every capability has evidence that resolves to a project record", () => {
  assert.ok(profile.capabilities.length >= 12);

  for (const capability of profile.capabilities) {
    assert.ok(capability.id);
    assert.ok(capability.summary.length > 40);
    assert.ok(capability.application.length > 60);
    assert.ok(capability.evidence.length > 0);
    for (const evidenceId of capability.evidence) {
      assert.ok(projectIds.has(evidenceId), `${capability.id} references missing ${evidenceId}`);
    }
  }
});

test("project identifiers and routes are unique", () => {
  assert.equal(projectIds.size, projects.length);
  assert.equal(new Set(projects.map((project) => project.slug)).size, projects.length);
});

test("each project provides technical depth and direct HTTPS evidence", () => {
  for (const project of projects) {
    assert.ok(project.summary.length > 60, `${project.id} needs a meaningful summary`);
    assert.ok(project.architecture.length >= 3, `${project.id} needs architecture detail`);
    assert.ok(project.interfaces.length >= 3, `${project.id} needs interface detail`);
    assert.ok(project.decisions.length >= 2, `${project.id} needs decision detail`);
    assert.ok(project.quality.length >= 3, `${project.id} needs quality detail`);
    assert.ok(project.evidenceLinks.length > 0, `${project.id} needs evidence`);

    for (const link of project.evidenceLinks) {
      assert.equal(new URL(link.url).protocol, "https:");
    }
  }
});

test("historical distinctions and education limits remain explicit", () => {
  const serialized = JSON.stringify(profile);
  assert.match(serialized, /Joomla engineering from 2008/);
  assert.match(serialized, /official Joomla volunteer record/);
  assert.match(serialized, /degree not completed/);
  assert.doesNotMatch(serialized, /top 3%/i);
  assert.doesNotMatch(serialized, /GitBible version 2|Summon index/i);
});

test("the public repository estate is complete, layered, and directly linked", () => {
  assert.equal(repositories.length, 95);
  assert.equal(new Set(repositories.map((repository) => repository.id)).size, repositories.length);
  assert.equal(new Set(repositories.map((repository) => repository.url)).size, repositories.length);

  const expectedOwnerCounts = {
    Llewellynvdm: 20,
    getbible: 28,
    joomengine: 27,
    octoleo: 13,
    trueChristian: 7,
  };

  for (const [owner, expected] of Object.entries(expectedOwnerCounts)) {
    assert.equal(
      repositories.filter((repository) => repository.owner === owner).length,
      expected,
      `${owner} evidence count changed`,
    );
  }

  for (const repository of repositories) {
    assert.ok(repository.summary.length > 40, `${repository.id} needs meaningful context`);
    assert.ok(repository.signals.length > 0, `${repository.id} needs technical evidence`);
    assert.equal(new URL(repository.url).hostname, "github.com");
    if (/Generated JSON/.test(repository.language)) {
      assert.equal(repository.tier, "catalogue");
    }
  }
});

test("Shell and C++ evidence is represented beyond recent projects", () => {
  const repositoryIds = new Set(repositories.map((repository) => repository.id));
  for (const id of [
    "octoleo-octojoom",
    "octoleo-octosync",
    "octoleo-joomengine",
    "personal-backup-system",
    "personal-coinrate",
    "personal-game-of-life",
    "personal-gofish",
  ]) {
    assert.ok(repositoryIds.has(id), `${id} is missing from the public record`);
  }

  assert.ok(
    profile.capabilities
      .find((capability) => capability.id === "linux-automation")
      .evidence.includes("octojoom"),
  );
  assert.ok(
    profile.capabilities
      .find((capability) => capability.id === "native-systems")
      .evidence.includes("cpp-public-lineage"),
  );
  assert.ok(projectIds.has("octoleo-automation"));
  assert.ok(projectIds.has("cpp-public-lineage"));
});
