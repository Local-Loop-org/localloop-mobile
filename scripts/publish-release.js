#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const APP_JSON = path.join(process.cwd(), 'app.json');
const ZERO_SHA = '0000000000000000000000000000000000000000';
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$/;

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'detect':
      detectVersionBump();
      break;
    case 'prepare':
      prepareVersionForEas();
      break;
    case 'build-android':
      buildAndroidApk();
      break;
    case 'notes':
      writeReleaseNotes();
      break;
    default:
      fail(`Unknown publish-release command: ${command || '<missing>'}`);
  }
}

function detectVersionBump() {
  const appVersion = getCurrentAppVersion();
  const previousVersion = getPreviousAppVersion(process.env.BEFORE_SHA);
  const buildNumber = requiredEnv('BUILD_NUMBER');
  const shouldPublish = previousVersion !== appVersion;

  console.log(`Previous app version: ${previousVersion || '<missing>'}`);
  console.log(`Current app version: ${appVersion}`);
  console.log(`Should publish: ${shouldPublish}`);

  setOutput('should_publish', String(shouldPublish));
  setOutput('app_version', appVersion);
  setOutput('release_tag', `mobile-v${appVersion}`);
  setOutput('build_number', buildNumber);
}

function prepareVersionForEas() {
  const appVersion = requiredEnv('APP_VERSION');
  const buildNumber = requiredEnv('BUILD_NUMBER');

  validateAppVersion(appVersion);
  validateBuildNumber(buildNumber);

  const appConfig = readJson(APP_JSON);
  appConfig.expo = appConfig.expo || {};
  appConfig.expo.android = appConfig.expo.android || {};
  appConfig.expo.ios = appConfig.expo.ios || {};

  appConfig.expo.version = appVersion;
  appConfig.expo.android.versionCode = Number(buildNumber);
  appConfig.expo.ios.buildNumber = buildNumber;

  writeJson(APP_JSON, appConfig);

  patchAndroidNativeVersion(appVersion, buildNumber);
  patchIosNativeVersion(appVersion, buildNumber);

  console.log(`expo.version=${appConfig.expo.version}`);
  console.log(`android.versionCode=${appConfig.expo.android.versionCode}`);
  console.log(`ios.buildNumber=${appConfig.expo.ios.buildNumber}`);
}

function buildAndroidApk() {
  const result = spawnSync(
    'eas',
    [
      'build',
      '--platform',
      'android',
      '--profile',
      'production',
      '--non-interactive',
      '--json',
      '--wait',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
    },
  );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    fail(`EAS Android build failed with exit code ${result.status}`);
  }

  const builds = parseJson(result.stdout, 'EAS build output');
  const apkUrl =
    builds[0]?.artifacts?.buildUrl ||
    builds[0]?.artifacts?.applicationArchiveUrl;

  if (!apkUrl) {
    fail('Failed to extract APK URL from EAS build output');
  }

  setOutput('apk_url', apkUrl);
}

function writeReleaseNotes() {
  const notes = [
    `App version: ${requiredEnv('APP_VERSION')}`,
    `Build number: ${requiredEnv('BUILD_NUMBER')}`,
    `Commit: ${requiredEnv('GITHUB_SHA')}`,
    `Branch: ${requiredEnv('GITHUB_REF_NAME')}`,
    '',
  ].join('\n');

  fs.writeFileSync('release-notes.txt', notes);
  console.log(notes);
}

function getCurrentAppVersion() {
  const version = readJson(APP_JSON).expo?.version;

  if (!version) {
    fail('Missing expo.version in app.json');
  }

  validateAppVersion(version);
  return version;
}

function getPreviousAppVersion(beforeSha) {
  if (!beforeSha || beforeSha === ZERO_SHA) {
    return '';
  }

  if (!gitObjectExists(`${beforeSha}:app.json`)) {
    return '';
  }

  const previousAppJson = execFileSync('git', ['show', `${beforeSha}:app.json`], {
    encoding: 'utf8',
  });

  return parseJson(previousAppJson, 'previous app.json').expo?.version || '';
}

function gitObjectExists(ref) {
  try {
    execFileSync('git', ['cat-file', '-e', ref], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function patchAndroidNativeVersion(appVersion, buildNumber) {
  const gradleFile = path.join(process.cwd(), 'android/app/build.gradle');

  if (!fs.existsSync(gradleFile)) {
    console.log(
      'No android/app/build.gradle found; EAS will generate Android versioning from app.json.',
    );
    return;
  }

  replaceInFile(gradleFile, [
    [/versionName "[^"]+"/g, `versionName "${appVersion}"`],
    [/versionCode \d+/g, `versionCode ${buildNumber}`],
  ]);
}

function patchIosNativeVersion(appVersion, buildNumber) {
  const infoPlist = path.join(process.cwd(), 'ios/LocalLoop/Info.plist');
  const xcodeProject = path.join(
    process.cwd(),
    'ios/LocalLoop.xcodeproj/project.pbxproj',
  );

  if (!fs.existsSync(infoPlist)) {
    console.log(
      'No ios/LocalLoop/Info.plist found; EAS will generate iOS versioning from app.json.',
    );
  } else {
    replaceInFile(infoPlist, [
      [
        /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/g,
        `$1${appVersion}$2`,
      ],
      [
        /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/g,
        `$1${buildNumber}$2`,
      ],
    ]);
  }

  if (fs.existsSync(xcodeProject)) {
    replaceInFile(xcodeProject, [
      [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${appVersion};`],
      [
        /CURRENT_PROJECT_VERSION = [^;]+;/g,
        `CURRENT_PROJECT_VERSION = ${buildNumber};`,
      ],
    ]);
  }
}

function replaceInFile(filePath, replacements) {
  let contents = fs.readFileSync(filePath, 'utf8');

  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(contents)) {
      fail(`Could not find expected version pattern in ${filePath}`);
    }

    pattern.lastIndex = 0;
    contents = contents.replace(pattern, replacement);
  }

  fs.writeFileSync(filePath, contents);
  console.log(`Updated ${path.relative(process.cwd(), filePath)}`);
}

function readJson(filePath) {
  return parseJson(fs.readFileSync(filePath, 'utf8'), filePath);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    fail(`Failed to parse ${label}: ${error.message}`);
  }
}

function validateAppVersion(version) {
  if (!VERSION_PATTERN.test(version)) {
    fail(`Invalid expo.version: ${version}`);
  }
}

function validateBuildNumber(buildNumber) {
  if (!/^[1-9][0-9]*$/.test(buildNumber)) {
    fail(`Invalid build number: ${buildNumber}`);
  }
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    fail(`Missing required environment variable: ${name}`);
  }

  return value;
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }

  console.log(`${name}=${value}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main();
