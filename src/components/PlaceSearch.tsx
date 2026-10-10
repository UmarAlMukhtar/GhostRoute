'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Waves,
  Route,
  TrainFront,
  GraduationCap,
  Hospital,
  Store,
  Signpost,
  X,
} from 'lucide-react';
import type { MapData } from '../lib/map/data';
import type { Role, Selection, SelectionAction } from '../lib/map/selection';
import { choosePlace, filterPlaces, type SearchPlace } from '../lib/map/places';
const icons = {
  Waterfront: Waves,
  Road: Route,
  'Railway station': TrainFront,
  College: GraduationCap,
  Hospital,
  'Shopping street': Store,
  Junction: Signpost,
};
interface Props {
  role: Role;
  selection: Selection | null;
  other: Selection | null;
  places: SearchPlace[];
  data: MapData;
  error: string;
  onAction: (action: SelectionAction) => void;
  onOpen: (open: boolean) => void;
  onFocusPlace: (coordinate: Selection['coordinate']) => void;
}
export default function PlaceSearch({
  role,
  selection,
  other,
  places,
  data,
  error,
  onAction,
  onOpen,
  onFocusPlace,
}: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{
    selection: Selection | null;
    text: string;
  } | null>(null);
  const [active, setActive] = useState(-1);
  const query =
    draft?.selection === selection ? draft.text : (selection?.label ?? '');
  const matches = useMemo(
    () =>
      filterPlaces(places, query).map((place) => ({
        place,
        action: choosePlace(data, place, role, other),
      })),
    [places, query, data, role, other],
  );
  const enabled = matches.flatMap((match, index) =>
    match.action.type === 'select' ? [index] : [],
  );
  function expand(value: boolean) {
    setOpen(value);
    onOpen(value);
  }
  function clear() {
    setDraft({ selection: null, text: '' });
    setActive(-1);
    onAction({ type: 'clear', role });
    expand(true);
    input.current?.focus();
  }
  function choose(index: number) {
    const match = matches[index];
    if (!match || match.action.type !== 'select') return;
    // Revalidate at selection time; never reuse stale route eligibility.
    const action = choosePlace(data, match.place, role, other);
    onAction(action);
    if (action.type === 'select') {
      setDraft(null);
      expand(false);
      onFocusPlace(action.selection.coordinate);
    }
  }
  useEffect(() => {
    if (open && active >= 0)
      document
        .getElementById(`${id}-option-${active}`)
        ?.scrollIntoView({ block: 'nearest' });
    else if (open)
      document
        .getElementById(`${id}-list`)
        ?.parentElement?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);
  return (
    <div
      className="place-search"
      onBlur={(event) => {
        // Keep the sheet height stable until the next action so blur cannot move a tapped control.
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={`${id}-input`}>
        {role === 'origin' ? 'Starting point' : 'Destination'}
      </label>
      <div className="search-input-row">
        <input
          ref={input}
          id={`${id}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            open && active >= 0 && matches[active]
              ? `${id}-option-${active}`
              : undefined
          }
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search Ernakulam places"
          value={query}
          disabled={Boolean(error)}
          onFocus={() => {
            expand(true);
            setActive(-1);
            onAction({ type: 'active', role });
          }}
          onChange={(event) => {
            setDraft({ selection: null, text: event.target.value });
            setActive(-1);
            if (selection) onAction({ type: 'clear', role });
            expand(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              expand(true);
              const index = enabled.indexOf(active),
                direction = event.key === 'ArrowDown' ? 1 : -1;
              setActive(
                enabled.length
                  ? enabled[
                      index < 0
                        ? direction === 1
                          ? 0
                          : enabled.length - 1
                        : (index + direction + enabled.length) % enabled.length
                    ]
                  : -1,
              );
            } else if (event.key === 'Enter' && open) {
              event.preventDefault();
              choose(active >= 0 ? active : (enabled[0] ?? -1));
            } else if (event.key === 'Escape') {
              event.preventDefault();
              expand(false);
            }
          }}
        />
        {(selection || query) && (
          <button
            className="search-clear"
            aria-label={`Clear ${role === 'origin' ? 'starting point' : 'destination'}`}
            onClick={clear}
          >
            <X size={15} />
          </button>
        )}
      </div>
      <span id={`${id}-hint`} className="search-hint">
        {error || 'Offline place catalog · © OpenStreetMap'}
      </span>
      {open && !error && (
        <div className="place-dropdown">
          <p className="suggestion-heading">
            {query.trim() ? 'Matching places' : 'Popular places in Ernakulam'}
          </p>
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={`${role} place suggestions`}
            className="place-results"
          >
            {matches.map(({ place, action }, index) => {
              const Icon = icons[place.category];
              return (
                <button
                  type="button"
                  key={place.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={active === index}
                  aria-disabled={action.type !== 'select'}
                  tabIndex={-1}
                  className="place-option"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                >
                  <Icon size={18} />
                  <span>
                    <strong>{place.name}</strong>
                    <small>
                      {place.locality} · {place.category}
                    </small>
                    {action.type === 'error' && (
                      <small className="place-unavailable">
                        Not connected to the other endpoint
                      </small>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="search-scope" role="status">
            {!matches.length
              ? 'No matching local places. Try a different name, coordinates, or pick on the map.'
              : !enabled.length
                ? 'These places cannot connect to your other endpoint. Clear or change that endpoint.'
                : `${matches.length} local places · nearest-node access is approximate`}
          </p>
        </div>
      )}
    </div>
  );
}
