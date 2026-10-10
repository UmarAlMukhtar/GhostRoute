import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const root = dirname(require.resolve('maplibre-gl/package.json'));
const { version } = require('maplibre-gl/package.json');
const destination = `public/vendor/maplibre/${version}`;
await mkdir(destination, { recursive: true });
// MapLibre 6 resolves its module worker relative to import.meta.url; serve it locally outside the Next bundle.
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  await copyFile(join(root, 'dist', file), join(destination, file));
}
await copyFile(join(root, 'LICENSE.txt'), join(destination, 'LICENSE.txt'));
