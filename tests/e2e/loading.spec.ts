import { expect, test } from '@playwright/test';

test('loader keeps painting while the full dataset initializes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    const samples: { time: number; transform: string }[] = [];
    Object.assign(window, { loadingSamples: samples });
    function frame(time: number) {
      const ring = document.querySelector('.map-placeholder .loading-ring');
      if (ring && !ring.hasAttribute('hidden'))
        samples.push({ time, transform: getComputedStyle(ring).transform });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  await page.goto('/');
  // Four-times throttling on shared CI needs more time than normal journeys.
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true', {
    timeout: 60000,
  });
  const samples = await page.evaluate(
    () =>
      Reflect.get(window, 'loadingSamples') as {
        time: number;
        transform: string;
      }[],
  );
  expect(new Set(samples.map((s) => s.transform)).size).toBeGreaterThan(20);
  const gaps = samples.slice(1).map((s, i) => s.time - samples[i].time);
  // Detect one task monopolizing preparation without assuming runner speed.
  const loadingDuration = samples.at(-1)!.time - samples[0].time;
  expect(Math.max(...gaps) / loadingDuration).toBeLessThan(0.25);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});

test('reduced motion keeps actual loading feedback without rotation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/dataset.json', async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await r.continue();
  });
  await page.goto('/');
  const ring = page.locator('.map-placeholder .loading-ring');
  await expect(ring).toBeVisible();
  expect(await ring.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  );
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
});
