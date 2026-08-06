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
    "assets/llewellyn-icon-light.svg",
    "assets/llewellyn-icon-dark.svg",
    "site.webmanifest",
    "CNAME",
    "robots.txt",
    "sitemap.xml",
  ];

  for (const file of required) {
    assert.ok(existsSync(new URL(file, dist)), `${file} was not generated`);
  }
});

test("the official portrait icons follow the selected colour mode", () => {
  const lightIcon = readFileSync(new URL("assets/llewellyn-icon-light.svg", dist), "utf8");
  const darkIcon = readFileSync(new URL("assets/llewellyn-icon-dark.svg", dist), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("site.webmanifest", dist), "utf8"));
  const lightIconReferences = index.match(/src="\/assets\/llewellyn-icon-light\.svg"/g) ?? [];
  const darkIconReferences = index.match(/src="\/assets\/llewellyn-icon-dark\.svg"/g) ?? [];

  assert.equal(lightIconReferences.length, 2);
  assert.equal(darkIconReferences.length, 2);
  assert.match(
    index,
    /<link rel="icon" type="image\/svg\+xml" href="\/assets\/llewellyn-icon-dark\.svg">/,
  );
  assert.doesNotMatch(index, /M21 3 37 12v18L21 39 5 30V12Z/);
  assert.match(lightIcon, /Right-facing pure vector portrait in plum, peach, gray, and blue/);
  assert.match(darkIcon, /Right-facing pure vector portrait in neutral grayscale/);
  assert.doesNotMatch(lightIcon, /<script|<foreignObject|\son\w+=|javascript:/i);
  assert.doesNotMatch(darkIcon, /<script|<foreignObject|\son\w+=|javascript:/i);
  assert.equal(manifest.icons[0].src, "/assets/llewellyn-icon-dark.svg");
  assert.equal(manifest.icons[0].type, "image/svg+xml");
  assert.equal(manifest.icons[0].sizes, "any");
});

test("the home page is semantic and correctly rooted at the custom domain", () => {
  assert.match(index, /<main id="main-content">/);
  assert.match(index, /<nav class="primary-nav" aria-label="Primary navigation">/);
  assert.match(index, /href="\/cv\/"/);
  assert.match(index, /href="\/record\/"/);
  assert.match(index, /src="\/assets\/llewellyn-van-der-merwe\.webp"/);
  assert.match(index, /https:\/\/llewellyn\.vdm\.io\/assets\/social-preview\.png/);
  assert.doesNotMatch(index, /(?:href|src)="\/profile\//);
  assert.match(index, /application\/ld\+json/);
});

test("the Pages artifact declares and indexes the custom domain", () => {
  const cname = readFileSync(new URL("CNAME", dist), "utf8").trim();
  const robots = readFileSync(new URL("robots.txt", dist), "utf8");
  const sitemap = readFileSync(new URL("sitemap.xml", dist), "utf8");

  assert.equal(cname, "llewellyn.vdm.io");
  assert.match(robots, /Sitemap: https:\/\/llewellyn\.vdm\.io\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/llewellyn\.vdm\.io\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/llewellyn\.vdm\.io\/cv\/<\/loc>/);
  assert.doesNotMatch(sitemap, /llewellynvdm\.github\.io|\/profile\//);
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
