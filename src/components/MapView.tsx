'use client';
import { useEffect, useRef, useState } from 'react';
import { Expand, Layers } from 'lucide-react';
import type { GeoJSONSource, Map as LibreMap } from 'maplibre-gl';
import type { GeoPoint, RouteResult } from '../lib/geo/types';
import type { MapData } from '../lib/map/data';
import type { Selection } from '../lib/map/selection';
import { EMPTY, localStyle, type MapOverlays } from '../lib/map/style';

interface Props {
  data: MapData;
  overview?: boolean;
  origin: Selection | null;
  destination: Selection | null;
  result: RouteResult | null;
  onPick: (point: GeoPoint) => void;
  selecting: boolean;
  sheetOpen: boolean;
  overlays?: MapOverlays;
}
function padding(sheetOpen: boolean) {
  return window.innerWidth < 760
    ? {
        top: 85,
        right: 35,
        bottom: sheetOpen ? 25 : 110,
        left: 35,
      }
    : {
        top: 100,
        right: window.innerWidth >= 1200 ? 390 : 130,
        bottom: 140,
        left: 430,
      };
}
export default function MapView({
  data,
  overview,
  origin,
  destination,
  result,
  onPick,
  selecting,
  sheetOpen,
  overlays,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const pick = useRef(onPick);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState('');
  const [tiles, setTiles] = useState<'loading' | 'online' | 'fallback'>(
    'loading',
  );
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);
  useEffect(() => {
    let cancelled = false;
    let instance: LibreMap | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;
    import('maplibre-gl')
      .then(
        ({
          Map,
          NavigationControl,
          ScaleControl,
          setWorkerUrl,
          getVersion,
        }) => {
          if (cancelled || !container.current) return;
          setWorkerUrl(
            `/vendor/maplibre/${getVersion()}/maplibre-gl-worker.mjs`,
          );
          instance = new Map({
            container: container.current,
            style: localStyle(data.roads),
            bounds: data.bounds,
            fitBoundsOptions: {
              padding: padding(
                container.current.classList.contains('sheet-open'),
              ),
              duration: 0,
            },
            attributionControl: false,
            maxZoom: 19,
            minZoom: 11,
            renderWorldCopies: false,
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
          });
          const map = instance;
          mapRef.current = map;
          map.touchZoomRotate.disableRotation();
          map.addControl(
            new NavigationControl({ showCompass: false }),
            'top-right',
          );
          map.addControl(new ScaleControl({ unit: 'metric' }), 'top-right');
          map
            .getCanvas()
            .setAttribute('aria-label', 'Interactive Ernakulam road map');
          map.on('idle', () => {
            if (container.current) {
              for (const layer of ['hazards', 'blockedRoads', 'alternative'])
                container.current.dataset[layer] = String(
                  map.queryRenderedFeatures({ layers: [layer] }).length > 0,
                );
              container.current.dataset.routeVisible = String(
                map.queryRenderedFeatures({ layers: ['route'] }).length > 0,
              );
            }
          });
          map.on('click', (e) => pick.current([e.lngLat.lng, e.lngLat.lat]));
          const fallback = () => {
            if (cancelled) return;
            clearTimeout(timeout);
            if (map.getLayer('basemap')) map.removeLayer('basemap');
            if (map.getSource('basemap')) map.removeSource('basemap');
            setTiles('fallback');
          };
          map.on('error', (e) => {
            if ('sourceId' in e && e.sourceId === 'basemap') fallback();
            else
              setFailure(
                'Map rendering failed. You can still calculate routes using the location presets.',
              );
          });
          map.getCanvas().addEventListener('webglcontextlost', () => {
            if (!cancelled)
              setFailure(
                'Map graphics were interrupted. Reload the page to restore the map. Routing controls still work.',
              );
          });
          map.on('load', () => {
            if (cancelled) return;
            setReady(true);
            map.addSource('basemap', {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              maxzoom: 19,
            });
            map.addLayer(
              {
                id: 'basemap',
                type: 'raster',
                source: 'basemap',
                paint: { 'raster-saturation': -0.7, 'raster-opacity': 0.65 },
              },
              'hazards',
            );
            timeout = setTimeout(fallback, 12000);
          });
          map.on('sourcedata', (e) => {
            if (
              e.sourceId === 'basemap' &&
              e.isSourceLoaded &&
              map.getSource('basemap')
            ) {
              clearTimeout(timeout);
              setTiles('online');
            }
          });
          observer = new ResizeObserver(() => map.resize());
          observer.observe(container.current);
        },
      )
      .catch(() => {
        if (!cancelled)
          setFailure(
            'WebGL map unavailable. Use the location presets below to calculate a route.',
          );
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      observer?.disconnect();
      instance?.remove();
      mapRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.resize();
    let active = true;
    const handleError = () => {
      if (active)
        setFailure(
          'Route geometry could not be displayed. The textual route result is still available.',
        );
    };
    const route = result?.status === 'found' ? result : null;
    (map.getSource('route') as GeoJSONSource)
      .setData(
        route?.geometry
          ? { type: 'Feature', properties: {}, geometry: route.geometry }
          : EMPTY,
      )
      .catch(handleError);
    for (const id of ['hazards', 'blockedRoads', 'alternative'] as const) {
      (map.getSource(id) as GeoJSONSource)
        .setData(overlays?.[id] ?? EMPTY)
        .catch(handleError);
    }
    map.setPaintProperty('route', 'line-dasharray', overlays ? [2, 1] : [1, 0]);
    const fitRoute = () => {
      if (overview) {
        map.fitBounds(data.bounds, {
          padding: padding(sheetOpen),
          duration: 0,
        });
        return;
      }
      const coordinates = [
        ...(route?.geometry?.coordinates ?? []),
        ...(overlays?.alternative?.features.flatMap(
          (f) => f.geometry.coordinates,
        ) ?? []),
        ...(overlays?.hazards?.features.flatMap((f) =>
          f.geometry.type === 'Polygon'
            ? f.geometry.coordinates.flat()
            : f.geometry.coordinates.flat(2),
        ) ?? []),
      ];
      if (coordinates?.length) {
        const xs = coordinates.map((p) => p[0]),
          ys = coordinates.map((p) => p[1]);
        map.fitBounds(
          [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
          {
            padding: padding(sheetOpen),
            maxZoom: 17,
            duration: matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 0
              : 600,
          },
        );
      } else if (route)
        map.fitBounds([route.origin.coordinate, route.origin.coordinate], {
          maxZoom: 16,
          padding: padding(sheetOpen),
          duration: 0,
        });
    };
    fitRoute();
    map.on('resize', fitRoute);
    return () => {
      map.off('resize', fitRoute);
      active = false;
    };
  }, [ready, result, overlays, sheetOpen, overview, data.bounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    const markers: import('maplibre-gl').Marker[] = [];
    import('maplibre-gl').then(({ Marker }) => {
      if (cancelled) return;
      for (const [role, selection] of [
        ['origin', origin],
        ['destination', destination],
      ] as const) {
        if (!selection) continue;
        const element = document.createElement('div');
        element.className = `map-pin ${role}`;
        element.textContent = role === 'origin' ? 'A' : 'B';
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', `${role} marker`);
        markers.push(
          new Marker({ element }).setLngLat(selection.coordinate).addTo(map),
        );
        if (selection.clicked && (selection.snapMeters ?? 0) > 2) {
          const clicked = document.createElement('div');
          clicked.className = 'clicked-point';
          clicked.setAttribute('role', 'img');
          clicked.setAttribute('aria-label', `${role} clicked location`);
          markers.push(
            new Marker({ element: clicked })
              .setLngLat(selection.clicked)
              .addTo(map),
          );
        }
      }
    });
    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
    };
  }, [ready, origin, destination]);
  function fitCoverage() {
    mapRef.current?.fitBounds(data.bounds, {
      padding: padding(sheetOpen),
      duration: 0,
    });
  }
  return (
    <>
      <div
        ref={container}
        className={`map-canvas ${sheetOpen ? 'sheet-open' : ''} ${selecting ? 'is-selecting' : ''}`}
        data-testid="map"
        data-ready={ready}
      />
      <div className="map-tools">
        <button
          className="icon-button"
          onClick={fitCoverage}
          disabled={!ready}
          aria-label="Fit road network"
        >
          <Expand size={18} />
        </button>
      </div>
      <div className="map-status" role="status">
        <Layers size={14} />
        {!ready && !failure
          ? 'Loading road map…'
          : tiles === 'fallback'
            ? 'Local roads · basemap unavailable'
            : tiles === 'loading'
              ? 'Local roads ready · loading basemap'
              : 'Street map + local roads'}
      </div>
      {failure && (
        <div className="map-failure" role="alert">
          {failure}
        </div>
      )}
    </>
  );
}
