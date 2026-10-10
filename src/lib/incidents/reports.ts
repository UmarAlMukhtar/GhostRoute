import type { GeoPoint } from '../geo/types.ts';
import { point, record } from '../geo/validate.ts';
import { withinCoverage } from '../simulation/hazards.ts';
export const incidentTypes = [
  'Flooded road',
  'Landslide',
  'Fire',
  'Road accident',
  'Fallen tree',
  'Road closure',
  'Other obstruction',
] as const;
export const statuses = [
  'Unverified',
  'Under review',
  'Verified',
  'Rejected',
  'Resolved',
] as const;
export const severities = ['Unspecified', 'Low', 'Medium', 'High'] as const;
export interface IncidentReport {
  source: 'local-report';
  id: string;
  type: (typeof incidentTypes)[number];
  coordinate: GeoPoint;
  description: string;
  severity: (typeof severities)[number];
  submittedAt: string;
  status: (typeof statuses)[number];
  segmentId?: string;
  seeded: boolean;
}
export const REPORT_KEY = 'ghostroute.local-reports.v1';
export function validateReport(
  input: unknown,
  bounds: readonly number[],
  segments: ReadonlySet<string>,
): IncidentReport {
  const raw = record(input, 'Report');
  const coordinate = point(raw.coordinate, 'Report location');
  if (!withinCoverage(coordinate, bounds))
    throw new Error(
      'Report location must be inside central Ernakulam coverage',
    );
  if (
    typeof raw.description !== 'string' ||
    raw.description.trim().length < 5 ||
    raw.description.length > 500
  )
    throw new Error('Description must contain 5–500 characters');
  if (
    !incidentTypes.includes(raw.type as IncidentReport['type']) ||
    !severities.includes(raw.severity as IncidentReport['severity'])
  )
    throw new Error('Invalid incident type or severity');
  if (
    typeof raw.id !== 'string' ||
    !raw.id ||
    raw.id.length > 100 ||
    typeof raw.submittedAt !== 'string' ||
    !Number.isFinite(Date.parse(raw.submittedAt))
  )
    throw new Error('Invalid report identifier or timestamp');
  if (
    raw.source !== 'local-report' ||
    !statuses.includes(raw.status as IncidentReport['status'])
  )
    throw new Error('Invalid report source or status');
  if (
    raw.segmentId !== undefined &&
    (typeof raw.segmentId !== 'string' || !segments.has(raw.segmentId))
  )
    throw new Error('Unknown associated road');
  // Local storage is user editable and can never establish trusted verification.
  return {
    source: 'local-report',
    id: raw.id,
    type: raw.type as IncidentReport['type'],
    coordinate,
    description: raw.description.trim(),
    severity: raw.severity as IncidentReport['severity'],
    submittedAt: raw.submittedAt,
    status:
      raw.status === 'Resolved' || raw.status === 'Rejected'
        ? raw.status
        : 'Unverified',
    segmentId: raw.segmentId as string | undefined,
    seeded: raw.seeded === true,
  };
}
export function loadReports(
  storage: Pick<Storage, 'getItem'>,
  bounds: readonly number[],
  segments: ReadonlySet<string>,
): IncidentReport[] {
  const saved = storage.getItem(REPORT_KEY);
  if (!saved) return [];
  const values: unknown = JSON.parse(saved);
  if (!Array.isArray(values) || values.length > 200)
    throw new Error('Local report archive is invalid or too large');
  const reports = values.map((value) =>
    validateReport(value, bounds, segments),
  );
  if (new Set(reports.map((r) => r.id)).size !== reports.length)
    throw new Error('Duplicate report IDs');
  return reports;
}
export function saveReport(
  storage: Pick<Storage, 'setItem'>,
  reports: readonly IncidentReport[],
  report: IncidentReport,
  now = Date.now(),
) {
  if (reports.length >= 200)
    throw new Error('Local report limit reached (200)');
  if (reports.some((r) => r.id === report.id))
    throw new Error('Duplicate report ID');
  if (
    reports.filter((r) => !r.seeded && now - Date.parse(r.submittedAt) < 60000)
      .length >= 3
  )
    throw new Error('Please wait: at most three local reports per minute');
  const next = [...reports, report];
  storage.setItem(REPORT_KEY, JSON.stringify(next));
  return next;
}
export function reportClosures(
  reports: readonly IncidentReport[],
  explore: boolean,
) {
  // No trusted verification source exists in the local adapter. Seeds never affect routes.
  return new Set(
    explore
      ? reports
          .filter((r) => r.status === 'Unverified' && !r.seeded && r.segmentId)
          .map((r) => r.segmentId!)
      : [],
  );
}
export interface ReportFilters {
  type: string;
  status: string;
  severity: string;
  activity: string;
}
export function filterReports(
  reports: readonly IncidentReport[],
  filters: ReportFilters,
) {
  return reports.filter(
    (r) =>
      (!filters.type || r.type === filters.type) &&
      (!filters.status || r.status === filters.status) &&
      (!filters.severity || r.severity === filters.severity) &&
      (filters.activity === 'all' ||
        (filters.activity === 'resolved'
          ? r.status === 'Resolved'
          : r.status !== 'Resolved' && r.status !== 'Rejected')),
  );
}
