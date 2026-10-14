import type { Audience } from '../../data/types';
import type { PhosphorName } from '../Icon';

/** The design's `n.toLocaleString('en-US')` (1208 -> "1,208"), engine-independent. */
export function fmtCount(n: number): string {
  return String(Math.max(0, Math.round(n))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );
}

/** "{time} · {place}", or just the time when there is no place. */
export function metaLine(time: string, place?: string): string {
  return place ? `${time} · ${place}` : time;
}

/** Audience glyph after the feed meta line (the create screen's icons). */
export const AUDIENCE_ICON: Record<Audience, PhosphorName> = {
  friends: 'users',
  public: 'globe-hemisphere-west',
  close: 'star',
};

/** Spoken audience, for the meta line's label. */
export const AUDIENCE_LABEL: Record<Audience, string> = {
  friends: 'Friends',
  public: 'Public',
  close: 'Close friends',
};

/** Two taps on a photo within this window count as a double-tap. */
export const DOUBLE_TAP_MS = 260;
