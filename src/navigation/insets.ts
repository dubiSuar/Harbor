import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Geometry of the floating tab bar (SPEC 4.1), shared so scroll content can
// clear it.

/** Height of the dark pill and the FAB. */
export const TAB_BAR_HEIGHT = 62;
/** Left / right inset of the bar row. */
export const TAB_BAR_SIDE = 16;
/** Gap between the pill and the FAB. */
export const TAB_BAR_GAP = 10;
/** The create FAB (62x62). */
export const FAB_SIZE = 62;
/** Height of the white fade zone behind the bar. */
export const TAB_ZONE_HEIGHT = 140;

/**
 * Distance from the screen's bottom edge to the bar's bottom edge: the
 * design's 30, as `max(insets.bottom - 4, 14)` on a real device.
 */
export function useTabBarOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom - 4, 14);
}

/**
 * Bottom padding a scroll view inside a tab needs to clear the bar:
 * offset + 62 + `extra` (default 20). The design's values relative to its
 * 30 offset: Feed 130 (extra 38), Explore / Profile 100 (extra 8), Brief
 * 104 (extra 12).
 */
export function useTabBarClearance(extra = 20) {
  return useTabBarOffset() + TAB_BAR_HEIGHT + extra;
}
