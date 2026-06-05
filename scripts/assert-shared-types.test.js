const { findDrift } = require('./assert-shared-types');

const pkg = {
  dependencies: {
    '@localloop/shared-types': '^2.11.0',
    '@localloop/geo-utils': '^1.2.0',
    axios: '^1.13.6',
  },
};

const lock = {
  packages: {
    'node_modules/@localloop/shared-types': { version: '2.11.0' },
    'node_modules/@localloop/geo-utils': { version: '1.2.0' },
  },
};

describe('findDrift', () => {
  it('reports no problems when installed versions match the lockfile', () => {
    const { checked, problems } = findDrift({
      pkg,
      lock,
      readInstalledVersion: (name) =>
        ({
          '@localloop/shared-types': '2.11.0',
          '@localloop/geo-utils': '1.2.0',
        })[name] ?? null,
    });

    expect(checked).toBe(2);
    expect(problems).toEqual([]);
  });

  it('flags a package that drifted from the lockfile (the real bug)', () => {
    const { problems } = findDrift({
      pkg,
      lock,
      readInstalledVersion: (name) =>
        name === '@localloop/shared-types' ? '2.10.0' : '1.2.0',
    });

    expect(problems).toEqual([
      '@localloop/shared-types installed 2.10.0 does not match lockfile 2.11.0',
    ]);
  });

  it('flags a declared @localloop package that is not installed', () => {
    const { problems } = findDrift({
      pkg,
      lock,
      readInstalledVersion: (name) =>
        name === '@localloop/shared-types' ? null : '1.2.0',
    });

    expect(problems).toEqual([
      '@localloop/shared-types is pinned at 2.11.0 but not installed',
    ]);
  });

  it('ignores non-@localloop dependencies', () => {
    const { checked } = findDrift({
      pkg,
      lock,
      readInstalledVersion: () => '2.11.0',
    });

    // axios is declared but must not be checked.
    expect(checked).toBe(2);
  });
});
