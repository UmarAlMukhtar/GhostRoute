import { ArrowRight, RotateCcw, X } from 'lucide-react';
import type { RouteResult } from '../lib/geo/types';
import { compareRoutes } from '../lib/simulation/session';
import { formatDistance } from '../lib/map/selection';
import { demoSteps } from '../lib/map/demo';
export default function DemoGuide({
  step,
  baseline,
  current: route,
  blockedCount,
  onStep,
  onExit,
}: {
  step: number;
  baseline: RouteResult | null;
  current: RouteResult | null;
  blockedCount: number;
  onStep: (step: number) => void;
  onExit: () => void;
}) {
  const current = demoSteps[step];
  const comparison = compareRoutes(baseline, route);
  return (
    <section className="demo-guide" aria-label="Guided demo">
      <div className="guide-heading">
        <span>
          DEMO MODE · {step + 1} / {demoSteps.length}
        </span>
        <button
          className="icon-button"
          aria-label="Exit Demo Mode"
          onClick={onExit}
        >
          <X size={17} />
        </button>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <h2>{current.title}</h2>
        <p>{current.cue}</p>
      </div>
      {baseline?.status === 'found' && (
        <div className="guide-metrics" aria-live="polite">
          <strong>
            {formatDistance(baseline.distanceMeters)}
            {current.stage > 0
              ? ` → ${route?.status === 'found' ? formatDistance(route.distanceMeters) : 'Unavailable'}`
              : ' · baseline'}
          </strong>
          {current.stage > 0 && (
            <span>
              {comparison
                ? `+${formatDistance(comparison.additionalMeters)} · `
                : ''}
              {blockedCount} road segments blocked
            </span>
          )}
        </div>
      )}
      <progress
        aria-label="Demo progress"
        max={demoSteps.length}
        value={step + 1}
      />
      <button
        className="primary guide-next"
        onClick={() => onStep((step + 1) % demoSteps.length)}
      >
        {current.next}
        <ArrowRight size={17} />
      </button>
      <button className="guide-reset" onClick={() => onStep(0)}>
        <RotateCcw size={14} />
        Reset demo
      </button>
    </section>
  );
}
