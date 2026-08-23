#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaces = {
  ordinaryRust: join(scriptDirectory, "examples", "rust-00-reading-rust"),
  codeAsData: join(scriptDirectory, "examples", "rust-01-stringify"),
  compileTime: join(scriptDirectory, "examples", "rust-02-compile-time"),
};

for (const directory of Object.values(workspaces)) {
  const format = spawnSync("cargo", ["fmt", "--all", "--", "--check"], {
    cwd: directory,
    encoding: "utf8",
  });
  if (format.error) {
    console.error(`Could not run Cargo: ${format.error.message}`);
    process.exit(1);
  }
  if (format.status !== 0) {
    process.stderr.write(format.stderr);
    process.stdout.write(format.stdout);
    process.exit(format.status ?? 1);
  }
}

const compileTimeTests = spawnSync(
  "cargo",
  ["test", "--quiet", "--locked", "--workspace"],
  {
    cwd: workspaces.compileTime,
    encoding: "utf8",
  },
);
if (compileTimeTests.status !== 0) {
  process.stderr.write(compileTimeTests.stderr);
  process.stdout.write(compileTimeTests.stdout);
  process.exit(compileTimeTests.status ?? 1);
}

function checkRun(directory, args, expectedLines, label) {
  const run = spawnSync("cargo", ["run", "--quiet", "--locked", ...args], {
    cwd: directory,
    encoding: "utf8",
  });
  if (run.status !== 0) {
    process.stderr.write(run.stderr);
    process.stdout.write(run.stdout);
    process.exit(run.status ?? 1);
  }

  const expected = expectedLines.join("\n");
  const actual = run.stdout.replaceAll("\r\n", "\n").trimEnd();
  if (actual !== expected) {
    console.error(
      `${label} produced unexpected output.\n\nExpected:\n${expected}\n\nActual:\n${actual}`,
    );
    process.exit(1);
  }
}

checkRun(
  workspaces.ordinaryRust,
  [],
  [
    "leaves at minute 65",
    "leaves at minute 65",
    "leaves at minute 90",
    "cancelled",
  ],
  "rust-00-reading-rust",
);

checkRun(
  workspaces.codeAsData,
  ["--package", "stringify-demo"],
  ["1 + 1", "x", "relation road(src: City, dst: City);", "2"],
  "rust-01-stringify",
);

checkRun(
  workspaces.compileTime,
  ["--package", "compile-time-demo"],
  ["14"],
  "rust-02-compile-time default demo",
);

checkRun(
  workspaces.compileTime,
  ["--package", "compile-time-demo", "--example", "compare"],
  ["true", "false"],
  "rust-02-compile-time comparison demo",
);

console.log(
  "Checked formatting, compilation, tests, and output for all Rust workspaces.",
);
