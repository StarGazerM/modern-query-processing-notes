#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const buildDirectory = join(scriptDirectory, "build");
const htmlFiles = readdirSync(buildDirectory).filter((name) => name.endsWith(".html"));
const failures = [];

for (const file of htmlFiles) {
  const source = readFileSync(join(buildDirectory, file), "utf8");
  const ids = new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));

  for (const match of source.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:)/.test(href)) continue;

    const [relativeTarget, fragment] = href.split("#", 2);
    const targetFile = relativeTarget || file;
    const normalizedTarget = normalize(join(dirname(file), targetFile));
    const targetPath = join(buildDirectory, normalizedTarget);

    if (!existsSync(targetPath)) {
      failures.push(`${file}: missing target ${href}`);
      continue;
    }

    if (fragment) {
      const targetSource = relativeTarget
        ? readFileSync(targetPath, "utf8")
        : source;
      const targetIds = relativeTarget
        ? new Set([...targetSource.matchAll(/\sid="([^"]+)"/g)].map((entry) => entry[1]))
        : ids;
      if (!targetIds.has(fragment)) failures.push(`${file}: missing anchor ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML pages and their internal links.`);
}
