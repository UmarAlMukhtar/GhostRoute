import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, test } from '@playwright/test';

// Exercise the production helper against MapLibre's real public source API,
// without exposing a test-only map handle in the application.
const roads = JSON.parse(
  readFileSync('public/data/ernakulam/roads.geojson', 'utf8'),
);
const expectedHash = createHash('sha256')
  .update(JSON.stringify(roads))
  .digest('hex');
const helper = ts.transpileModule(
  readFileSync('src/lib/map/roads.ts', 'utf8'),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
).outputText;

test('real renderer source retains the complete original network after preparation', async ({
  page,
}) => {
  await page.route('**/renderer-helper.js', (r) =>
    r.fulfill({ contentType: 'text/javascript', body: helper }),
  );
  await page.route('**/renderer-maplibre.js', (r) =>
    r.fulfill({
      contentType: 'text/javascript',
      body: readFileSync(
        'node_modules/maplibre-gl/dist/maplibre-gl.mjs',
        'utf8',
      ),
    }),
  );
  await page.route('**/renderer-fixture', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><div id="map" style="width:360px;height:800px"></div><script type="module">
import {Map,setWorkerUrl} from './renderer-maplibre.js';
import {loadRoadSource} from './renderer-helper.js';
setWorkerUrl('/vendor/maplibre/6.13.0/maplibre-gl-worker.mjs');
const roads=await (await fetch('/data/ernakulam/roads.geojson')).json();
const map=new Map({container:'map',center:[76.3,10],zoom:10,style:{version:8,sources:{roads:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:[{id:'roads',type:'line',source:'roads'}]}});
map.on('load',async()=>{try {
const source=map.getSource('roads');
window.prepared=false;
window.finished=await loadRoadSource(source,roads,()=>true);
const actual=await source.getData();
const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(actual)));
window.result={count:actual.features.length,hash:[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')};
window.prepared=true;
}catch(e){window.fixtureError=String(e);}});
</script>`,
    }),
  );
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/renderer-fixture');
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'result')), {
      timeout: 60000,
    })
    .toEqual({ count: 57706, hash: expectedHash });
  expect(await page.evaluate(() => Reflect.get(window, 'finished'))).toBe(true);
  expect(
    await page.evaluate(() => Reflect.get(window, 'fixtureError')),
  ).toBeUndefined();
  expect(errors).toEqual([]);
});

test('renderer readiness waits for all roads and navigation cancels preparation safely', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const batches: Record<string, number[]> = {};
    Object.assign(window, { roadBatches: batches });
    const original = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...rest) {
      const add =
        message?.data?.source === 'roads' && message.data.dataDiff?.add;
      if (add) {
        const id = String(message.sourceMapId);
        (batches[id] ??= []).push(add.length);
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/');
  await page.waitForFunction(
    () => Object.keys(Reflect.get(window, 'roadBatches')).length > 0,
  );
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'false');
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true', {
    timeout: 60000,
  });
  const batches = await page.evaluate(
    () => Reflect.get(window, 'roadBatches') as Record<string, number[]>,
  );
  const totals = Object.values(batches).map((counts) =>
    counts.reduce((sum, n) => sum + n, 0),
  );
  expect(totals.at(-1)).toBe(57706);
  expect(
    Object.values(batches)
      .flat()
      .every((count) => count <= 5000),
  ).toBe(true);
  expect(errors).toEqual([]);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});

test('a renderer handoff failure stays visible and a reload recovers', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('rendererFailureInjected')) return;
    const original = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (message?.data?.source === 'roads' && message.data.dataDiff?.add) {
        sessionStorage.setItem('rendererFailureInjected', 'true');
        Worker.prototype.postMessage = original;
        throw new Error('Injected renderer handoff failure');
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
  });
  await page.goto('/');
  await expect(
    page.getByText(
      'Map rendering failed. You can still calculate routes using the location presets.',
    ),
  ).toBeVisible();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'false');
  await page.reload();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  expect(errors).toEqual([]);
});
