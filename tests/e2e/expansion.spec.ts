import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseMapData } from '../../src/lib/map/data';
import { validatePlaces, filterPlaces } from '../../src/lib/map/places';
import { createFloodEngine } from '../../src/lib/simulation/flood';
import { hazardInputs } from '../../src/lib/simulation/hazards';
type E2EWindow = Window & {
  __ghostRouteE2E?: boolean;
  __ghostRouteProject?: (
    coordinate: [number, number],
  ) => Promise<{ x: number; y: number }>;
};
const read = (name: string): unknown =>
  JSON.parse(readFileSync(`public/data/ernakulam/${name}`, 'utf8'));
const data = parseMapData(
  read('graph.json'),
  read('roads.geojson'),
  read('demo-paths.json'),
);
const places = validatePlaces(read('places.json'), data);
const a = filterPlaces(places, 'Edappally Market')[0],
  b = filterPlaces(places, 'Vyttila Mobility Hub')[0];
const baseline = data.router.findRoute({
  originNodeId: a.nodeId,
  destinationNodeId: b.nodeId,
});
if (baseline.status !== 'found')
  throw new Error('Cross-region route unavailable');
const engine = createFloodEngine(data.graph);
const center = baseline
  .geometry!.coordinates.slice(20, -20)
  .find((point, index) => {
    if (index % 20) return false;
    const input = hazardInputs([
      {
        source: 'simulation',
        id: 'test',
        kind: 'flood',
        enabled: true,
        center: [point[0], point[1]],
        radiusMeters: 50,
      },
    ]);
    const impact = engine.evaluate(input.zones);
    if (impact.status !== 'ready') return false;
    const route = data.router.findRoute({
      originNodeId: a.nodeId,
      destinationNodeId: b.nodeId,
      blockedSegmentIds: impact.blockedSegmentIds,
      blockedNodeIds: impact.blockedNodeIds,
    });
    return (
      route.status === 'found' && route.distanceMeters > baseline.distanceMeters
    );
  });
if (!center) throw new Error('Need a real cross-region detour fixture');
async function pick(page: Page, coordinate: readonly number[]) {
  await expect(page.getByTestId('map')).not.toHaveClass(/sheet-open/);
  const point = await page.evaluate(async (value) => {
    const project = (window as E2EWindow).__ghostRouteProject;
    if (!project) throw new Error('Map projection helper unavailable');
    if (value.length !== 2) throw new Error('Expected a two-value coordinate');
    return project([value[0]!, value[1]!]);
  }, coordinate);
  await page.mouse.click(point.x, point.y);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as E2EWindow).__ghostRouteE2E = true;
  });
});
async function search(page: Page, label: string, query: string, name: string) {
  const input = page.getByRole('combobox', { name: label, exact: true });
  await input.fill(query);
  const option = page.getByRole('option').filter({ hasText: name }).first();
  await expect(option).toBeVisible();
  await option.click();
}
test('expanded Edappally–Vyttila navigation, disasters, local deletion and dedicated demo', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  const started = Date.now();
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await test.info().attach('load-timing', {
    body: JSON.stringify({ readyMilliseconds: Date.now() - started }),
    contentType: 'application/json',
  });
  await expect(page.getByLabel('Routing mode')).toHaveCount(0);
  await search(page, 'Starting point', 'Edappally Market', a.name);
  await search(page, 'Destination', 'Vyttila Mobility Hub', b.name);
  await expect(page.getByTestId('route-distance')).toContainText('km');
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'true',
  );
  const original = await page.getByTestId('route-distance').textContent();
  await page.screenshot({
    path: info.outputPath('expanded-light.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page
    .getByRole('button', { name: 'Place flood on map', exact: true })
    .click();
  await pick(page, center);
  await expect(page.getByTestId('custom-blocked')).not.toHaveText('0');
  await expect(page.getByTestId('route-distance')).not.toHaveText(original!);
  await page.getByRole('button', { name: 'Fire', exact: true }).click();
  await page
    .getByRole('button', { name: 'Place fire on map', exact: true })
    .click();
  await pick(page, center);
  await expect(
    page.getByRole('button', { name: 'Fire 2 Enabled' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Remove hazard', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Fire 2 Enabled' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Report Incident', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose report location on map' })
    .click();
  await pick(page, center);
  await page
    .getByLabel('Description', { exact: true })
    .fill('Expanded journey report created in this browser.');
  await page
    .getByRole('button', { name: 'Save local report' })
    .evaluate((button) => {
      const form = button.closest('form')!;
      form.requestSubmit();
      form.requestSubmit();
    });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem('ghostroute.local-reports.v1') ?? '[]',
        ).filter((report: { seeded: boolean }) => !report.seeded).length,
    ),
  ).toBe(1);
  await expect(
    page.getByText('Expanded journey report created in this browser.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Delete report', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancel deletion' }).click();
  await expect(
    page.getByText('Expanded journey report created in this browser.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Delete report', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm deletion' }).click();
  await expect(page.getByText('Local report deleted.')).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Theme', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByRole('button', { name: 'Report Incident', exact: true })
    .click();
  await expect(page.getByText('0 visible local reports')).toBeVisible();
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Demo scenarios' }).click();
  await page.getByRole('button', { name: 'Start guided demo' }).click();
  await page
    .getByRole('button', { name: 'Load Hospital Road route', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Simulate Hospital Road flood', exact: true })
    .click();
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
  await page.screenshot({
    path: info.outputPath('demo-light.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('light interface ignores system and old stored themes; page links match and focus', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() =>
    localStorage.setItem('ghostroute.theme', 'dark'),
  );
  for (const path of ['/', '/demo']) {
    await page.goto(path);
    await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
    await expect(page.getByLabel('Theme', { exact: true })).toHaveCount(0);
    expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
    expect(
      await page
        .locator('html')
        .evaluate((el) => getComputedStyle(el).colorScheme),
    ).toBe('light');
    const nav = page.getByRole('navigation', { name: 'Pages' });
    const navigation = nav.getByRole('link', {
      name: 'Navigation',
      exact: true,
    });
    const demo = nav.getByRole('link', { name: 'Demo', exact: true });
    await expect(path === '/' ? navigation : demo).toHaveAttribute(
      'aria-current',
      'page',
    );
    const boxes = await Promise.all([
      navigation.boundingBox(),
      demo.boundingBox(),
    ]);
    expect(boxes[0]!.height).toBe(boxes[1]!.height);
    expect(boxes[0]!.y).toBe(boxes[1]!.y);
    expect(boxes[0]!.x + boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x);
    await navigation.focus();
    await expect(navigation).toBeFocused();
    expect(
      await navigation.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
    for (const width of [320, 360, 760, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      const controls = await page.locator('.header-actions').evaluate((el) => {
        const elements = [...el.querySelectorAll('a, button')];
        return elements
          .map((element) => {
            const r = element.getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              right: r.right,
              bottom: r.bottom,
              visible: r.width > 0 && r.height > 0,
            };
          })
          .filter((r) => r.visible);
      });
      for (const box of controls) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
      for (let a = 0; a < controls.length; a++)
        for (let b = a + 1; b < controls.length; b++) {
          const first = controls[a],
            second = controls[b];
          expect(
            first.right <= second.x ||
              second.right <= first.x ||
              first.bottom <= second.y ||
              second.bottom <= first.y,
          ).toBe(true);
        }
    }
  }
});
test('map routing becomes usable while search index is pending and recovers', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/data/ernakulam/places.json', async (route) => {
    await hold;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  const input = page.getByRole('combobox', {
    name: 'Starting point',
    exact: true,
  });
  await expect(input).toBeDisabled();
  await expect(input).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.search-loading')).toHaveCount(2);
  await expect(
    page.getByText('Loading local place search…').first(),
  ).toBeVisible();
  await page.getByText('Enter coordinates', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('9.9713489');
  await page.getByLabel('Longitude', { exact: true }).fill('76.28014');
  await page.getByRole('button', { name: 'Set coordinate' }).click();
  await expect(input).not.toHaveValue('');
  release();
  await expect(input).toBeEnabled();
  await expect(input).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.search-loading')).toHaveCount(0);
  await input.fill('Edappally Market');
  await expect(
    page.getByRole('option').filter({ hasText: a.name }).first(),
  ).toBeVisible();
});
test('failed local search index preserves coordinate routing', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.route('**/data/ernakulam/places.json', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await expect(
    page
      .getByText(
        'Local place index unavailable. Use coordinates or map selection; reload to retry.',
      )
      .first(),
  ).toBeVisible();
  await page.getByText('Enter coordinates', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('9.9713489');
  await page.getByLabel('Longitude', { exact: true }).fill('76.28014');
  await page.getByRole('button', { name: 'Set coordinate' }).click();
  await page
    .getByLabel('Endpoint', { exact: true })
    .selectOption('destination');
  await page.getByRole('button', { name: 'Set coordinate' }).click();
  await expect(page.getByTestId('route-distance')).toContainText('0.0 m');
});
