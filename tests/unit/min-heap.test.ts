import { expect, it } from 'vitest';
import { MinHeap } from '../../src/lib/routing/min-heap.ts';

it('orders decreased priorities and equal-cost IDs without duplicate entries', () => {
  const heap = new MinHeap();
  heap.decrease('D', 10);
  heap.decrease('B', 10);
  heap.decrease('C', 20);
  heap.decrease('A', 30);
  heap.decrease('C', 1);
  heap.decrease('A', 10);
  heap.decrease('B', 50);
  expect([heap.pop(), heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual([
    { nodeId: 'C', distance: 1 },
    { nodeId: 'A', distance: 10 },
    { nodeId: 'B', distance: 10 },
    { nodeId: 'D', distance: 10 },
    undefined,
  ]);
  heap.decrease('C', 2);
  expect(heap.pop()).toEqual({ nodeId: 'C', distance: 2 });
});
it('maintains its position index across both sift directions', () => {
  const heap = new MinHeap();
  for (let i = 63; i >= 0; i--)
    heap.decrease(String(i).padStart(2, '0'), 100 + i);
  for (let i = 63; i >= 0; i--)
    heap.decrease(String(i).padStart(2, '0'), 63 - i);
  for (let i = 63; i >= 0; i--)
    expect(heap.pop()).toEqual({
      nodeId: String(i).padStart(2, '0'),
      distance: 63 - i,
    });
  expect(heap.pop()).toBeUndefined();
});
