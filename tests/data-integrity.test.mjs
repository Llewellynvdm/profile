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

test("the 12 flagship briefs preserve canonical order and interpretation limits", () => {
  const flagships = projects
    .filter((project) => project.flagship)
    .sort((left, right) => left.rank - right.rank);

  assert.equal(flagships.length, 12);
  assert.deepEqual(
    flagships.map((project) => project.id),
    [
      "jcb",
      "joomla-mcp",
      "octojoom",
      "joomengine-containers",
      "librarian",
      "joomla-docker",
      "robot",
      "sword",
      "scripture",
      "opencode-platform",
      "colibri-setup",
      "getbible-v3",
    ],
  );

  for (const project of flagships) {
    assert.ok(project.keyEvidence.length > 60);
    assert.ok(project.evidenceLimits.length > 40);
    assert.match(project.reviewedTo, /^2026-\d{2}-\d{2}$/);
  }
});

test("chronology, title, education limits, confidentiality and contact policy remain explicit", () => {
  const serialized = JSON.stringify(profile);
  assert.equal(
    profile.identity.title,
    "Director | Senior Architectural Engineer of Intelligent Software and Systems",
  );
  assert.ok(profile.timeline.some((item) => item.period === "2008–present"));
  assert.ok(profile.timeline.some((item) => item.period === "2010–present"));
  assert.ok(profile.timeline.some((item) => /official Joomla volunteer service/i.test(item.title)));
  assert.match(serialized, /degree not completed/);
  assert.match(serialized, /confidential/i);
  assert.equal(profile.identity.telegram, "https://t.me/llewellynvdm");
  assert.equal(Object.hasOwn(profile.identity, "email"), false);
  assert.equal(Object.hasOwn(profile.identity, "telephone"), false);
  assert.doesNotMatch(serialized, /top 3%/i);
  assert.doesNotMatch(serialized, /GitBible version 2|Summon index/i);
});

test("the canonical repository record contains 109 unique, directly linked lineages", () => {
  assert.equal(repositories.length, 109);
  assert.equal(
    new Set(repositories.map((repository) => repository.repository)).size,
    repositories.length,
  );
  assert.equal(new Set(repositories.map((repository) => repository.url)).size, repositories.length);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(Object.groupBy(repositories, (repository) => repository.tier)).map(
        ([tier, records]) => [tier, records.length],
      ),
    ),
    {
      flagship: 12,
      major: 24,
      supporting: 35,
      "historical / foundation": 38,
    },
  );

  for (const repository of repositories) {
    assert.ok(repository.rank >= 1 && repository.rank <= 109);
    assert.ok(repository.purpose.length > 20, `${repository.repository} needs meaningful purpose`);
    assert.ok(
      repository.significance.length > 20,
      `${repository.repository} needs professional significance`,
    );
    assert.ok(Array.isArray(repository.technologies));
    assert.equal(new URL(repository.url).hostname, "github.com");
    if (repository.firstEvidence) {
      assert.match(repository.firstEvidence, /^\d{4}-\d{2}-\d{2}$/);
    }
    if (repository.latestEvidence) {
      assert.match(repository.latestEvidence, /^\d{4}-\d{2}-\d{2}$/);
    }
    if (repository.projectId) {
      assert.ok(
        projectIds.has(repository.projectId),
        `${repository.repository} references missing project ${repository.projectId}`,
      );
    }
  }
});

test("the canonical record includes the complete flagship repository order", () => {
  const flagships = repositories
    .filter((repository) => repository.tier === "flagship")
    .sort((left, right) => left.rank - right.rank);

  assert.deepEqual(
    flagships.map((repository) => repository.repository),
    [
      "joomengine/Joomla-Component-Builder",
      "joomengine/joomla-mcp",
      "octoleo/octojoom",
      "octoleo/joomengine",
      "getbible/librarian",
      "joomla-docker/docker-joomla",
      "getbible/robot",
      "getbible/sword",
      "getbible/scripture",
      "vast-development-method/opencode-platform",
      "vast-development-method/colibri-setup",
      "getbible/v3_builder",
    ],
  );
});

test("Shell and native engineering evidence extends beyond the newest flagships", () => {
  const repositoryNames = new Set(repositories.map((repository) => repository.repository));
  for (const repository of [
    "octoleo/octojoom",
    "octoleo/octosync",
    "octoleo/joomengine",
    "Llewellynvdm/Backup-System",
    "Llewellynvdm/CoinRate",
    "Llewellynvdm/game-of-life",
    "Llewellynvdm/GoFish",
  ]) {
    assert.ok(repositoryNames.has(repository), `${repository} is missing from the public record`);
  }
});
