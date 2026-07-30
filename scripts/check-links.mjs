import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL("../dist/", import.meta.url);
const rootPath = root.pathname;
const htmlFiles = [];
const productionOrigin = "https://llewellyn.vdm.io";

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (extname(path) === ".html") {
      htmlFiles.push(path);
    }
  }
}

function outputTarget(pathname) {
  const sitePath = pathname.replace(/^\/+/, "");
  if (!sitePath) return join(rootPath, "index.html");
  const direct = join(rootPath, sitePath);
  if (existsSync(direct) && !statSync(direct).isDirectory()) return direct;
  return join(direct, "index.html");
}

const errors = [];
walk(rootPath);

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const ids = new Set(Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]));
  const references = Array.from(html.matchAll(/\s(?:href|src)="([^"]+)"/g), (match) => match[1]);

  for (const href of references) {
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("data:")
    ) {
      continue;
    }

    if (href.startsWith("#")) {
      const fragment = href.slice(1);
      if (fragment && !ids.has(fragment)) {
        errors.push(`${relative(rootPath, file)}: missing local anchor #${fragment}`);
      }
      continue;
    }

    const parsed = new URL(href, `${productionOrigin}/`);
    if (parsed.origin !== productionOrigin) {
      errors.push(`${relative(rootPath, file)}: unexpected protocol-relative route ${href}`);
      continue;
    }

    const target = outputTarget(parsed.pathname);
    if (!existsSync(target)) {
      errors.push(`${relative(rootPath, file)}: missing target ${href}`);
      continue;
    }

    if (parsed.hash && extname(target) === ".html") {
      const targetHtml = readFileSync(target, "utf8");
      const targetId = parsed.hash.slice(1);
      if (
        !new RegExp(`\\sid="${targetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(targetHtml)
      ) {
        errors.push(`${relative(rootPath, file)}: missing target anchor ${href}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${htmlFiles.length} HTML files: internal routes, assets, and anchors resolve.`,
  );
}
