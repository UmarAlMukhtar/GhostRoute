import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('rejects an unrelated input response without replacing the frozen source or manifest', () => {
  const source = readFileSync('data/source/ernakulam.osm.json.gz');
  const manifest = readFileSync('data/source/manifest.json');
  const dir = mkdtempSync(join(tmpdir(), 'ghostroute-acquisition-'));
  try {
    const path = join(dir, 'wrong-region.json');
    writeFileSync(
      path,
      JSON.stringify({
        bounds: { minlon: 0, minlat: 0, maxlon: 1, maxlat: 1 },
        elements: [],
      }),
    );
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', 'scripts/acquire-roads.ts', path],
      { encoding: 'utf8' },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('bounds differ');
    expect(readFileSync('data/source/ernakulam.osm.json.gz')).toEqual(source);
    expect(readFileSync('data/source/manifest.json')).toEqual(manifest);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
