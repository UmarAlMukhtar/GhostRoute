import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from '../../src/app/page';

describe('foundation page', () => {
  it('clearly distinguishes planned functionality from a verified safety product', () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toContain('Plan your route');
    expect(html).toContain('Preparing the Ernakulam road network');
    expect(html).toContain('Simulation only.');
    expect(html).toContain('not verified safe');
  });
});
