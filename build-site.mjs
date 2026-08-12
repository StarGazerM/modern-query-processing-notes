#!/usr/bin/env node

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const notePattern = /^(?:\d{2}-|rust-\d{2}-|aside-).+\.md$/;
const noteSources = readdirSync(scriptDirectory)
  .filter((name) => notePattern.test(name))
  .sort();
const courseSources = ["index.md", "syllabus.md", "schedule.md", "project.md"];
const sources = [...courseSources, ...noteSources];

for (const source of sources) {
  const result = spawnSync(
    process.execPath,
    [join(scriptDirectory, "render.mjs"), join(scriptDirectory, source)],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
