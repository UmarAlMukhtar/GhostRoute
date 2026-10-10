'use client';
import { useEffect, useRef, useState } from 'react';
import { Expand, Layers } from 'lucide-react';
import type { GeoJSONSource, Map as LibreMap } from 'maplibre-gl';
import type { GeoPoint, RouteResult } from '../lib/geo/types';
import type { MapData } from '../lib/map/data';
import type { IncidentReport } from '../lib/incidents/reports';
import type { Selection, Role } from '../lib/map/selection';
import { EMPTY, localStyle, type MapOverlays } from '../lib/map/style';

interface Props {
  data: MapData;
  overview?: boolean;
  focusPlace?: { coordinate: GeoPoint; sequence: number };
  origin: Selection | null;
  destination: Selection | null;
  result: RouteResult | null;
  onPick: (point: GeoPoint, segmentId?: string) => void;
  onReposition: (role: Role, point: GeoPoint) => void;
  reports: IncidentReport[];
  onReportClick: (id: string) => void;
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
  focusPlace,
  origin,
  destination,
  result,
  onPick,
  onReposition,
  reports,
  onReportClick,
  selecting,
  sheetOpen,
  overlays,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const pick = useRef(onPick);
  const callbacks = useRef({ onReposition, onReportClick, selecting });
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState('');
  const [tiles, setTiles] = useState<'loading' | 'online' | 'fallback'>(
    'loading',
  );
  useEffect(() => {
    pick.current = onPick;
    callbacks.current = { onReposition, onReportClick, selecting };
  }, [onPick, onReposition, onReportClick, selecting]);
  useEffect(() => {
    let cancelled = false;
    let instance: LibreMap | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;
    import('maplibre-gl')
      .then(
        ({
          Map,
          Marker,
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
            style: localStyle(data.roads, data.bounds),
            bounds: data.bounds,
            fitBoundsOptions: {
              padding: padding(
                container.current.classList.contains('sheet-open'),
              ),
              duration: 0,
            },
            attributionControl: false,
            maxZoom: 19,
            minZoom: 9,
            renderWorldCopies: false,
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
          });
          const map = instance;
          mapRef.current = map;
          const label = document.createElement('div');
          label.className = 'demo-area-map-label';
          label.textContent = 'GhostRoute Demo Area — Ernakulam';
          label.title =
            'Dataset extent only. Roads inside may be disconnected or unmapped.';
          const areaLabel = new Marker({
            element: label,
            anchor: 'top',
            offset: [0, 8],
          })
            .setLngLat([(data.bounds[0] + data.bounds[2]) / 2, data.bounds[3]])
            .addTo(map);
          map.once('remove', () => areaLabel.remove());
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
              for (const layer of [
                'hazards',
                'blockedRoads',
                'alternative',
                'reports',
                'demo-boundary',
              ])
                container.current.dataset[
                  layer === 'demo-boundary' ? 'demoBoundary' : layer
                ] = String(
                  map.queryRenderedFeatures({ layers: [layer] }).length > 0,
                );
              container.current.dataset.routeVisible = String(
                map.queryRenderedFeatures({ layers: ['route'] }).length > 0,
              );
            }
          });
          map.on('click', (e) => {
            const report = map.queryRenderedFeatures(e.point, {
              layers: ['reports'],
            })[0];
            if (report && !callbacks.current.selecting) {
              callbacks.current.onReportClick(String(report.properties.id));
              return;
            }
            const road = map.queryRenderedFeatures(
              [
                [e.point.x - 5, e.point.y - 5],
                [e.point.x + 5, e.point.y + 5],
              ],
              { layers: ['roads'] },
            )[0];
            pick.current(
              [e.lngLat.lng, e.lngLat.lat],
              road?.properties.segmentId,
            );
          });
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
              'demo-area',
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
    function applyTheme() {
      const dark = document.documentElement.dataset.theme === 'dark';
      if (container.current)
        container.current.dataset.theme = dark ? 'dark' : 'light';
      map!.setPaintProperty(
        'background',
        'background-color',
        dark ? '#102028' : '#edf1ef',
      );
      map!.setPaintProperty(
        'road-casing',
        'line-color',
        dark ? '#355363' : '#c3cecb',
      );
      map!.setPaintProperty(
        'roads',
        'line-color',
        dark ? '#668a99' : '#ffffff',
      );
      map!.setPaintProperty(
        'route',
        'line-color',
        dark ? '#78aaff' : '#2563eb',
      );
      map!.setPaintProperty(
        'alternative',
        'line-color',
        dark ? '#71de9c' : '#15803d',
      );
      map!.setPaintProperty(
        'blockedRoads',
        'line-color',
        dark ? '#ff7474' : '#dc2626',
      );
      for (const layer of ['route-casing', 'alternative-casing'])
        map!.setPaintProperty(layer, 'line-color', dark ? '#102028' : '#fff');
      if (map!.getLayer('basemap'))
        map!.setLayoutProperty(
          'basemap',
          'visibility',
          dark ? 'none' : 'visible',
        );
    }
    applyTheme();
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [ready]);

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
    if (!ready || !mapRef.current) return;
    (mapRef.current.getSource('reports') as GeoJSONSource)
      .setData({
        type: 'FeatureCollection',
        features: reports.map((report) => ({
          type: 'Feature',
          properties: { id: report.id, status: report.status },
          geometry: { type: 'Point', coordinates: report.coordinate },
        })),
      })
      .catch(() =>
        setFailure(
          'Incident markers could not be displayed. Use the report list.',
        ),
      );
  }, [ready, reports]);
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
        const marker = new Marker({ element, draggable: true })
          .setLngLat(selection.coordinate)
          .addTo(map);
        marker.on('dragend', () => {
          const location = marker.getLngLat();
          marker.setLngLat(selection.coordinate);
          callbacks.current.onReposition(role, [location.lng, location.lat]);
        });
        markers.push(marker);
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
  useEffect(() => {
    const map = mapRef.current;
    if (
      !ready ||
      !map ||
      !focusPlace ||
      (origin && destination) ||
      ![origin, destination].some(
        (selection) => selection?.coordinate === focusPlace.coordinate,
      )
    )
      return;
    map.fitBounds([focusPlace.coordinate, focusPlace.coordinate], {
      padding: padding(sheetOpen),
      maxZoom: 16,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 400,
    });
  }, [ready, focusPlace, origin, destination, sheetOpen]);
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
          className="view-demo-area"
          onClick={fitCoverage}
          disabled={!ready}
          aria-label="View Demo Area"
        >
          <Expand size={18} />
          <span>View Demo Area</span>
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
