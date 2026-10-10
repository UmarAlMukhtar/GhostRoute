import { chromium } from '@playwright/test';

// Cold browser contexts, fixed emulated viewport/CPU and tile-free production builds.
const url = process.argv[2] ?? 'http://127.0.0.1:3100';
const browser = await chromium.launch({ headless: true });
try {
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({
      viewport: { width: 360, height: 800 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    const assets = [];
    context.on('response', async (response) => {
      if (!response.url().includes('/data/')) return;
      await response.finished();
      assets.push({
        name: response.url().split('/').at(-1),
        sizes: await response.request().sizes(),
        timing: response.request().timing(),
      });
    });
    await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
    await page.addInitScript(() => {
      const measurements = {
        readyAt: null,
        longTasks: [],
        frameGaps: [],
        loaderSamples: [],
      };
      Object.assign(window, { loadingMeasurements: measurements });
      new PerformanceObserver((list) => {
        measurements.longTasks.push(
          ...list.getEntries().map((e) => ({
            start: e.startTime,
            duration: e.duration,
          })),
        );
      }).observe({ type: 'longtask', buffered: true });
      let last = performance.now();
      function frame(now) {
        measurements.frameGaps.push(now - last);
        last = now;
        if (
          measurements.readyAt === null &&
          document.querySelector('[data-testid=map]')?.dataset.ready === 'true'
        )
          measurements.readyAt = now;
        const ring = document.querySelector('.map-placeholder .loading-ring');
        if (ring && !ring.hasAttribute('hidden'))
          measurements.loaderSamples.push({
            time: now,
            transform: getComputedStyle(ring).transform,
          });
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid=map]')?.dataset.ready === 'true',
      undefined,
      { timeout: 90000 },
    );
    await page.waitForTimeout(1000);
    const result = await page.evaluate(() => {
      const m = window.loadingMeasurements;
      return {
        mapReadyMs: m.readyAt,
        longestTaskMs: Math.max(0, ...m.longTasks.map((t) => t.duration)),
        totalLongTaskMs: m.longTasks.reduce((sum, t) => sum + t.duration, 0),
        longestFrameGapMs: Math.max(...m.frameGaps),
        distinctLoaderFrames: new Set(m.loaderSamples.map((s) => s.transform))
          .size,
        heapBytes: performance.memory?.usedJSHeapSize ?? null,
        longTasks: m.longTasks,
      };
    });
    if (!result.mapReadyMs)
      throw new Error('Map did not reach actual readiness');
    console.log(
      JSON.stringify({
        run,
        url,
        viewport: '360x800',
        cpuRate: 4,
        ...result,
        assets,
      }),
    );
    await context.close();
  }
} finally {
  await browser.close();
}
