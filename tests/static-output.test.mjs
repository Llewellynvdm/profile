import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const indexPath = new URL("index.html", dist);
const index = readFileSync(indexPath, "utf8");

test("production output contains the required static routes and official CV files", () => {
  const required = [
    "index.html",
    "404.html",
    "cv/index.html",
    "record/index.html",
    "evidence/index.html",
    "projects/joomla-component-builder/index.html",
    "projects/joomla-mcp/index.html",
    "projects/octojoom-shell-deployment-platform/index.html",
    "projects/joomengine-container-release-engine/index.html",
    "projects/getbible-librarian/index.html",
    "projects/joomla-docker/index.html",
    "projects/getbible-robot-mini-app/index.html",
    "projects/getbible-sword-php-extension/index.html",
    "projects/getbible-scripture-application-layer/index.html",
    "projects/opencode-platform/index.html",
    "projects/colibri-local-ai-infrastructure/index.html",
    "projects/getbible-v3-publication-pipeline/index.html",
    "documents/llewellyn-van-der-merwe-executive-cv.pdf",
    "documents/llewellyn-van-der-merwe-exhaustive-cv.pdf",
    "robots.txt",
    "sitemap.xml",
  ];

  for (const file of required) {
    assert.ok(existsSync(new URL(file, dist)), `${file} was not generated`);
  }
});

test("the home page is semantic and correctly based for GitHub Pages", () => {
  assert.match(index, /<main id="main-content">/);
  assert.match(index, /<nav class="primary-nav" aria-label="Primary navigation">/);
  assert.match(index, /href="\/profile\/cv\/"/);
  assert.match(index, /href="\/profile\/record\/"/);
  assert.match(index, /src="\/profile\/assets\/llewellyn-van-der-merwe\.webp"/);
  assert.match(index, /https:\/\/llewellynvdm\.github\.io\/profile\/assets\/social-preview\.png/);
  assert.match(index, /application\/ld\+json/);
});

test("core content is server-rendered and reflects the canonical source priorities", () => {
  assert.match(index, /Capability is shown through application/);
  assert.match(index, /Substantial systems, not isolated keywords/);
  assert.match(index, /Canonical public engineering record/);
  assert.match(index, /109 attributable, de-duplicated public repository lineages/);
  assert.match(index, /Company leadership and long-term delivery/);
  assert.match(index, /Sustained responsibility, not isolated snapshots/);
  assert.match(index, /Joomla Component Builder/);
  assert.match(index, /Contact via Telegram/);
});

test("built public HTML contains no direct email or telephone contact data", () => {
  const htmlFiles = [
    "index.html",
    "cv/index.html",
    "record/index.html",
    "evidence/index.html",
    "projects/joomla-component-builder/index.html",
  ];
  const combined = htmlFiles.map((file) => readFileSync(new URL(file, dist), "utf8")).join("\n");

  assert.doesNotMatch(combined, /mailto:|tel:/i);
  assert.doesNotMatch(combined, /llewellyn@vdm\.io/i);
  assert.doesNotMatch(combined, /\+264\s*81\s*248\s*7770/);
});

test("built HTML contains no placeholders or retired highlighted claims", () => {
  const htmlFiles = [
    "index.html",
    "cv/index.html",
    "record/index.html",
    "projects/joomla-component-builder/index.html",
  ];
  const combined = htmlFiles.map((file) => readFileSync(new URL(file, dist), "utf8")).join("\n");

  assert.doesNotMatch(combined, /lorem ipsum|\bTODO\b|placeholder content/i);
  assert.doesNotMatch(combined, /top 3%/i);
  assert.doesNotMatch(combined, /GitBible version 2|Summon index/i);
  assert.doesNotMatch(combined, /25\.17M|PUBLIC CHANGE FLOOR/i);
});
