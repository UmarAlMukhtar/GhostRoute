'use client';
import { useState } from 'react';
import { Droplets, Mountain, Flame, Ban, MapPin } from 'lucide-react';
import type { GeoPoint } from '../lib/geo/types';
import type { HazardKind, SimulatedHazard } from '../lib/simulation/hazards';
import {
  incidentTypes,
  severities,
  statuses,
  type IncidentReport,
  type ReportFilters,
} from '../lib/incidents/reports';
export const hazardNames: Record<HazardKind, string> = {
  flood: 'Flood',
  landslide: 'Landslide',
  fire: 'Fire',
  roadblock: 'Roadblock / accident',
};
const icons = {
  flood: Droplets,
  landslide: Mountain,
  fire: Flame,
  roadblock: Ban,
};
export function HazardControls({
  hazards,
  setHazards,
  place,
  selected,
  select,
}: {
  hazards: SimulatedHazard[];
  setHazards: (value: SimulatedHazard[]) => void;
  place: (kind: HazardKind, radius: number, id?: string) => void;
  selected: string | null;
  select: (id: string) => void;
}) {
  const [kind, setKind] = useState<HazardKind>('flood');
  const [radius, setRadius] = useState(50);
  return (
    <section className="explore-controls" aria-label="Custom hazards">
      <h2>Create a scenario</h2>
      <p>
        Illustrative exclusion zones. Place several hazards and compare the
        route.
      </p>
      <div className="hazard-types">
        {(Object.keys(hazardNames) as HazardKind[]).map((value) => {
          const Icon = icons[value];
          return (
            <button
              key={value}
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              <Icon size={19} />
              <span>{hazardNames[value]}</span>
            </button>
          );
        })}
      </div>
      {kind !== 'roadblock' && (
        <label>
          New hazard radius · {radius} m
          <input
            aria-label="New hazard radius"
            type="range"
            min="10"
            max="500"
            step="10"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </label>
      )}
      <button
        className="primary"
        disabled={hazards.length >= 20}
        onClick={() => place(kind, radius)}
      >
        <MapPin size={16} />
        {kind === 'roadblock'
          ? 'Click a road to block'
          : `Place ${hazardNames[kind].toLowerCase()} on map`}
      </button>
      <p className="selection-hint">
        Up to 20 hazards. Roadblocks affect both directions; removing or
        disabling reopens the road.
      </p>
      <ul className="hazard-list">
        {hazards.map((hazard, index) => {
          const Icon = icons[hazard.kind];
          return (
            <li
              key={hazard.id}
              className={selected === hazard.id ? 'selected' : ''}
            >
              <button
                className="hazard-title"
                onClick={() => select(hazard.id)}
                aria-expanded={selected === hazard.id}
              >
                <Icon size={17} />
                <strong>
                  {hazardNames[hazard.kind]} {index + 1}
                </strong>
                <span>{hazard.enabled ? 'Enabled' : 'Disabled'}</span>
              </button>
              {selected === hazard.id && (
                <div className="hazard-editor">
                  <p>
                    {hazard.center[1].toFixed(5)}, {hazard.center[0].toFixed(5)}
                    {hazard.segmentId && ` · Road ${hazard.segmentId}`}
                  </p>
                  {hazard.kind !== 'roadblock' && (
                    <label>
                      Affected radius · {hazard.radiusMeters} m
                      <input
                        aria-label="Affected radius"
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        value={hazard.radiusMeters}
                        onChange={(e) =>
                          setHazards(
                            hazards.map((h) =>
                              h.id === hazard.id
                                ? { ...h, radiusMeters: Number(e.target.value) }
                                : h,
                            ),
                          )
                        }
                      />
                    </label>
                  )}
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={hazard.enabled}
                      onChange={(e) =>
                        setHazards(
                          hazards.map((h) =>
                            h.id === hazard.id
                              ? { ...h, enabled: e.target.checked }
                              : h,
                          ),
                        )
                      }
                    />
                    Enable this hazard
                  </label>
                  <div className="control-row">
                    <button
                      className="secondary"
                      onClick={() =>
                        place(hazard.kind, hazard.radiusMeters, hazard.id)
                      }
                    >
                      Move hazard
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        setHazards(hazards.filter((h) => h.id !== hazard.id))
                      }
                    >
                      Remove hazard
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        className="secondary"
        disabled={!hazards.length}
        onClick={() => setHazards([])}
      >
        Clear simulated hazards
      </button>
    </section>
  );
}
export function ReportControls({
  reports,
  coordinate,
  segmentId,
  onPlace,
  onSubmit,
  filters,
  setFilters,
  selected,
  select,
  error,
  ready,
  onDelete,
}: {
  reports: IncidentReport[];
  coordinate: GeoPoint | null;
  segmentId?: string;
  onPlace: () => void;
  onSubmit: (
    type: IncidentReport['type'],
    description: string,
    severity: IncidentReport['severity'],
  ) => boolean;
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  selected: string | null;
  select: (id: string) => void;
  error: string;
  ready: boolean;
  onDelete: (id: string) => boolean;
}) {
  const [type, setType] = useState<IncidentReport['type']>('Flooded road');
  const [severity, setSeverity] =
    useState<IncidentReport['severity']>('Unspecified');
  const [description, setDescription] = useState('');
  const [form, setForm] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  return (
    <section className="explore-controls" aria-label="Incident reports">
      <h2>Community reports</h2>
      <p className="notice">
        Local demonstration only. Saved in this browser, not shared or sent to
        responders. Reports are unverified.
      </p>
      <button
        className="primary"
        disabled={!ready}
        onClick={() => setForm(!form)}
      >
        {form ? 'Close report form' : 'New report'}
      </button>
      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSubmit(type, description, severity)) {
              setDescription('');
              setForm(false);
              setFeedback(
                'Report saved in this browser. It remains unverified.',
              );
            }
          }}
        >
          <label>
            Incident type
            <select
              aria-label="Incident type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as IncidentReport['type'])
              }
            >
              {incidentTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary" onClick={onPlace}>
            {coordinate
              ? 'Change report location'
              : 'Choose report location on map'}
          </button>
          <p>
            {coordinate
              ? `${coordinate[1].toFixed(5)}, ${coordinate[0].toFixed(5)} · ${segmentId ? `Road ${segmentId}` : 'No road association (click a road to associate)'}`
              : 'Choose a location before submitting.'}
          </p>
          <label>
            Description
            <textarea
              minLength={5}
              maxLength={500}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you observed; avoid personal information."
            />
          </label>
          <label>
            Severity
            <select
              aria-label="Severity"
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as IncidentReport['severity'])
              }
            >
              {severities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button className="primary" disabled={!coordinate || !ready}>
            Save local report
          </button>
        </form>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="report-filters">
        {(['type', 'status', 'severity', 'activity'] as const).map((key) => (
          <label key={key}>
            Filter {key}
            <select
              aria-label={`Filter ${key}`}
              value={filters[key]}
              onChange={(e) =>
                setFilters({ ...filters, [key]: e.target.value })
              }
            >
              {key === 'activity' ? (
                <>
                  <option value="all">All reports</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </>
              ) : (
                <>
                  <option value="">All</option>
                  {(key === 'type'
                    ? incidentTypes
                    : key === 'status'
                      ? statuses
                      : severities
                  ).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </>
              )}
            </select>
          </label>
        ))}
      </div>
      {feedback && (
        <p role="status" className="notice">
          {feedback}
        </p>
      )}
      <p role="status">{reports.length} visible local reports</p>
      {!reports.length && (
        <p>No reports match these filters. Reports you submit appear here.</p>
      )}
      {confirmDelete && (
        <div
          className="notice"
          role="alertdialog"
          aria-label="Confirm report deletion"
        >
          <p>Delete this local report permanently?</p>
          <div className="control-row">
            <button
              className="secondary"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel deletion
            </button>
            <button
              className="primary"
              onClick={() => {
                if (onDelete(confirmDelete)) {
                  setConfirmDelete(null);
                  setFeedback('Local report deleted.');
                }
              }}
            >
              Confirm deletion
            </button>
          </div>
        </div>
      )}
      <ul className="hazard-list">
        {reports.map((report) => (
          <li
            id={`report-${report.id}`}
            key={report.id}
            className={selected === report.id ? 'selected' : ''}
          >
            <button
              className="hazard-title"
              onClick={() => select(report.id)}
              aria-expanded={selected === report.id}
            >
              <span className="report-symbol">!</span>
              <strong>{report.type}</strong>
              <span>{report.status}</span>
            </button>
            {selected === report.id && (
              <div className="hazard-editor">
                <p>
                  {report.seeded && (
                    <strong>Illustrative seed — not an observation. </strong>
                  )}
                  {report.description}
                </p>
                <p>
                  {new Date(report.submittedAt).toLocaleString()} ·{' '}
                  {report.severity}
                </p>
                <p>
                  {report.coordinate[1].toFixed(5)},{' '}
                  {report.coordinate[0].toFixed(5)}
                  <br />
                  {report.segmentId
                    ? `Associated road: ${report.segmentId}`
                    : 'No associated road'}
                </p>
                {!report.seeded && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setConfirmDelete(report.id);
                      setFeedback('');
                    }}
                  >
                    Delete report
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
