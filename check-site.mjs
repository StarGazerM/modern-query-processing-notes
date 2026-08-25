#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const buildDirectory = join(scriptDirectory, "build");
const htmlFiles = readdirSync(buildDirectory).filter((name) => name.endsWith(".html"));
const failures = [];
const sourceRepositoryUrl =
  "https://github.com/StarGazerM/modern-query-processing-notes";
const sourceRepositoryRevision = process.env.NOTES_GITHUB_REVISION;

for (const file of htmlFiles) {
  const source = readFileSync(join(buildDirectory, file), "utf8");
  const ids = new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));

  if (source.includes(":::notice")) {
    failures.push(`${file}: unrendered :::notice directive`);
  }

  for (const match of source.matchAll(
    /<figure class="source-excerpt" data-source-path="([^"]+)" data-source-start="(\d+)" data-source-end="(\d+)">([\s\S]*?)<\/figure>/g,
  )) {
    const [, sourcePath, startText, endText, figure] = match;
    const start = Number(startText);
    const end = Number(endText);
    if (start < 1 || end < start) {
      failures.push(`${file}: invalid source line range ${startText}-${endText}`);
      continue;
    }

    if (sourceRepositoryRevision) {
      const href = figure.match(/<a class="source-link" href="([^"]+)"/)?.[1];
      const encodedPath = sourcePath.split("/").map(encodeURIComponent).join("/");
      const range = start === end ? `#L${start}` : `#L${start}-L${end}`;
      const expected =
        `${sourceRepositoryUrl}/blob/${encodeURIComponent(sourceRepositoryRevision)}/${encodedPath}${range}`;
      if (href !== expected) {
        failures.push(`${file}: source link does not match rendered file and lines`);
      }
    } else if (!figure.includes("source-link-pending")) {
      failures.push(`${file}: local source excerpt should identify its unpublished link`);
    }

    const sourceFile = join(scriptDirectory, sourcePath);
    if (!existsSync(sourceFile)) {
      failures.push(`${file}: source excerpt file is missing: ${sourcePath}`);
      continue;
    }
    const lineCount = readFileSync(sourceFile, "utf8")
      .replaceAll("\r\n", "\n")
      .replace(/\n$/, "")
      .split("\n").length;
    if (end > lineCount) {
      failures.push(`${file}: source line ${end} exceeds ${sourcePath}`);
    }
  }

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

  for (const match of source.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)) {
    const image = match[1];
    if (/^(?:https?:|data:)/.test(image)) continue;
    if (!existsSync(join(buildDirectory, normalize(join(dirname(file), image))))) {
      failures.push(`${file}: missing image ${image}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML pages and their internal links.`);
}
