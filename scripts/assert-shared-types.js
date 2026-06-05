#!/usr/bin/env node

/**
 * Drift guard: fail fast when an installed @localloop/* package in node_modules
 * has drifted from the version pinned in package-lock.json.
 *
 * Why this exists: a stale node_modules copy of @localloop/shared-types (2.10.0
 * vs. the lockfile-pinned 2.11.0) was missing the DM_TYPING event constant, so
 * `ChatSocketEvents.DM_TYPING` resolved to `undefined` at runtime and the app
 * emitted a malformed Socket.IO frame (`[null, …]`) that the server rejected and
 * the chat socket disconnected. TypeScript could not catch it — the typed
 * signature said `string`. This makes that class of drift loud at install/CI
 * time instead of at runtime.
 *
 * We compare against the lockfile's exact resolved version (not the package.json
 * caret range) on purpose: the real failure mode is "node_modules out of sync
 * with the lockfile", and exact equality keeps this script dependency-free (no
 * semver needed, which is only a transitive dep here).
 *
 * Alternative (narrower) check we could add: assert
 * `require('@localloop/shared-types').ChatSocketEvents.DM_TYPING` is a string —
 * verifies the exact runtime contract rather than a version number.
 *
 * Wired as `postinstall` and into `pretest` (CI).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Pure drift computation, injectable for tests.
 * @returns {{ checked: number, problems: string[] }}
 */
function findDrift({ pkg, lock, readInstalledVersion }) {
  const declared = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  const names = Object.keys(declared).filter((name) =>
    name.startsWith('@localloop/'),
  );

  const problems = [];
  for (const name of names) {
    const lockNode = lock.packages?.[`node_modules/${name}`];
    if (!lockNode || !lockNode.version) {
      problems.push(`${name} is not pinned in package-lock.json`);
      continue;
    }
    const expected = lockNode.version;
    const installed = readInstalledVersion(name);
    if (installed === null) {
      problems.push(`${name} is pinned at ${expected} but not installed`);
      continue;
    }
    if (installed !== expected) {
      problems.push(
        `${name} installed ${installed} does not match lockfile ${expected}`,
      );
    }
  }

  return { checked: names.length, problems };
}

function readInstalledVersionFromDisk(name) {
  const installedPkgPath = path.join(ROOT, 'node_modules', name, 'package.json');
  if (!fs.existsSync(installedPkgPath)) {
    return null;
  }
  return readJson(installedPkgPath).version;
}

function main() {
  const { checked, problems } = findDrift({
    pkg: readJson(path.join(ROOT, 'package.json')),
    lock: readJson(path.join(ROOT, 'package-lock.json')),
    readInstalledVersion: readInstalledVersionFromDisk,
  });

  if (problems.length > 0) {
    console.error('\n[assert-shared-types] @localloop dependency drift detected:');
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error('\nRun `npm ci` to sync node_modules with the lockfile.\n');
    process.exit(1);
  }

  console.log(
    `[assert-shared-types] OK — ${checked} @localloop package(s) match the lockfile`,
  );
}

if (require.main === module) {
  main();
}

module.exports = { findDrift };
