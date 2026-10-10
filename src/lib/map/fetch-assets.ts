import { unpackDataset } from '../geo/transport';
import { parseMapAssets } from './assets';

export async function fetchMapAssets() {
  const [dataset, fixture] = await Promise.all(
    ['dataset.json', 'demo-paths.json'].map(async (file) => {
      const response = await fetch(`/data/ernakulam/${file}`);
      if (!response.ok)
        throw new Error(`Could not load ${file} (${response.status}).`);
      return response.json() as Promise<unknown>;
    }),
  );
  const { graph, roads } = unpackDataset(dataset);
  return parseMapAssets(graph, roads, fixture);
}
