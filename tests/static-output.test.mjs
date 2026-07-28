import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const indexPath = new URL("index.html", dist);
const index = readFileSync(indexPath, "utf8");

test("production output contains the required static routes", () => {
  const required = [
    "index.html",
    "404.html",
    "cv/index.html",
    "evidence/index.html",
    "projects/joomla-component-builder/index.html",
    "projects/octojoom-shell-deployment-platform/index.html",
    "projects/getbible-engineering-ecosystem/index.html",
    "projects/getbiblesword-native-engine/index.html",
    "projects/joomla-mcp/index.html",
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
  assert.match(index, /src="\/profile\/assets\/llewellyn-van-der-merwe\.webp"/);
  assert.match(index, /https:\/\/llewellynvdm\.github\.io\/profile\/assets\/social-preview\.png/);
  assert.match(index, /application\/ld\+json/);
});

test("core content is server-rendered and not dependent on JavaScript", () => {
  assert.match(index, /Capability is shown through application/);
  assert.match(index, /Substantial systems, not isolated keywords/);
  assert.match(index, /Complete public engineering estate/);
  assert.match(index, /95 authored or directly maintained public repositories/);
  assert.match(index, /Sustained responsibility, not isolated snapshots/);
  assert.match(index, /Joomla Component Builder/);
});

test("built HTML contains no placeholders or unsupported highlighted claims", () => {
  const htmlFiles = ["index.html", "cv/index.html", "projects/joomla-component-builder/index.html"];
  const combined = htmlFiles.map((file) => readFileSync(new URL(file, dist), "utf8")).join("\n");

  assert.doesNotMatch(combined, /lorem ipsum|TODO|placeholder content/i);
  assert.doesNotMatch(combined, /top 3%/i);
  assert.doesNotMatch(combined, /GitBible version 2|Summon index/i);
});
