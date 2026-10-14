import { createContext, useContext } from 'react';
import { useIsTopScreen, useScreenKey } from './Navigator';

/**
 * False inside a MainTabs pane that is mounted but not showing. Defaults to
 * true, so components outside the tabs are always treated as visible.
 */
export const PaneVisibleContext = createContext(true);

export function usePaneVisible() {
  return useContext(PaneVisibleContext);
}

/**
 * True while this component can actually be seen: its tab pane is showing
 * and its screen is the top of the stack. Outside a navigator (tests,
 * previews) the stack part counts as true. Use it to pause perpetual loops.
 */
export function useOnScreen() {
  const paneVisible = usePaneVisible();
  const inNavigator = !!useScreenKey();
  const isTop = useIsTopScreen();
  return paneVisible && (!inNavigator || isTop);
}
