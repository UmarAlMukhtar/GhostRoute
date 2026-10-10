type Entry = { nodeId: string; distance: number };
const less = (a: Entry, b: Entry) =>
  a.distance < b.distance || (a.distance === b.distance && a.nodeId < b.nodeId);

/** Indexed binary min-heap: one entry per node, O(log V) decrease-key/pop. */
export class MinHeap {
  private entries: Entry[] = [];
  private positions = new Map<string, number>();

  decrease(nodeId: string, distance: number): void {
    let index = this.positions.get(nodeId) ?? -1;
    if (index < 0) {
      index = this.entries.length;
      this.entries.push({ nodeId, distance });
      this.positions.set(nodeId, index);
    } else {
      if (distance >= this.entries[index].distance) return;
      this.entries[index] = { nodeId, distance };
    }
    while (index > 0) {
      const parent = (index - 1) >>> 1;
      if (!less(this.entries[index], this.entries[parent])) break;
      this.swap(index, parent);
      index = parent;
    }
  }

  pop(): Entry | undefined {
    const first = this.entries[0];
    if (!first) return undefined;
    const last = this.entries.pop()!;
    this.positions.delete(first.nodeId);
    if (this.entries.length) {
      this.entries[0] = last;
      this.positions.set(last.nodeId, 0);
      let index = 0;
      while (true) {
        const left = 2 * index + 1,
          right = left + 1;
        let next = index;
        if (
          left < this.entries.length &&
          less(this.entries[left], this.entries[next])
        )
          next = left;
        if (
          right < this.entries.length &&
          less(this.entries[right], this.entries[next])
        )
          next = right;
        if (next === index) break;
        this.swap(index, next);
        index = next;
      }
    }
    return first;
  }

  private swap(a: number, b: number): void {
    [this.entries[a], this.entries[b]] = [this.entries[b], this.entries[a]];
    this.positions.set(this.entries[a].nodeId, a);
    this.positions.set(this.entries[b].nodeId, b);
  }
}
