import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNav } from './Navigator';

/**
 * Tab state shared by the tab panes, the tab bar and pushed screens.
 *
 * - `useTabs()` -> { tab, setTab }: switch the tab under the stack from any
 *   screen (the design's `tab(x)`: call `nav.popToRoot()` first when you are
 *   on a pushed screen).
 * - `useScrollToTop(tab, fn)`: the bar calls `fn` when the active tab is
 *   tapped again.
 *
 * The provider is mounted once per signed-in session in App.tsx, above the
 * StackNavigator, so pushed screens can read and change the tab.
 */

export type TabKey = 'home' | 'explore' | 'brief' | 'profile';

export const TAB_KEYS: TabKey[] = ['home', 'explore', 'brief', 'profile'];

type TabBarValue = {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  /** Registers a tab's scroll-to-top. Returns the unregister function. */
  registerScrollToTop: (tab: TabKey, fn: () => void) => () => void;
  scrollToTop: (tab: TabKey) => void;
};

const TabBarContext = createContext<TabBarValue | null>(null);

export function TabBarProvider({
  children,
  initialTab = 'home',
}: {
  children: React.ReactNode;
  initialTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const scrollers = useRef(new Map<string, () => void>());

  const registerScrollToTop = useCallback((key: TabKey, fn: () => void) => {
    scrollers.current.set(key, fn);
    return () => {
      if (scrollers.current.get(key) === fn) {
        scrollers.current.delete(key);
      }
    };
  }, []);

  const scrollToTop = useCallback((key: TabKey) => {
    scrollers.current.get(key)?.();
  }, []);

  const value = useMemo(
    () => ({ tab, setTab, registerScrollToTop, scrollToTop }),
    [tab, registerScrollToTop, scrollToTop],
  );
  return (
    <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
  );
}

/** The bar's (and MainTabs') full access. */
export function useTabBar() {
  const ctx = useContext(TabBarContext);
  if (!ctx) {
    throw new Error('useTabBar must be used inside TabBarProvider');
  }
  return ctx;
}

/**
 * The active tab and a setter, from any screen of the signed-in stack.
 * Example (Settings profile card): `nav.popToRoot(); setTab('profile');`
 */
export function useTabs() {
  const { tab, setTab, scrollToTop } = useTabBar();
  return useMemo(
    () => ({ tab, setTab, scrollToTop }),
    [tab, setTab, scrollToTop],
  );
}

/**
 * The design's `tab(x)` from anywhere in the signed-in stack: closes every
 * pushed screen (the top one animates out), switches to `tab`, and with
 * `{ scrollTop: true }` scrolls that tab to the top (Create "Post").
 *
 *   const goToTab = useGoToTab();
 *   goToTab('brief');
 */
export function useGoToTab() {
  const nav = useNav();
  const { setTab, scrollToTop } = useTabBar();
  return useCallback(
    (tab: TabKey, options?: { scrollTop?: boolean }) => {
      nav.popToRoot();
      setTab(tab);
      if (options?.scrollTop) {
        scrollToTop(tab);
      }
    },
    [nav, setTab, scrollToTop],
  );
}

/**
 * Lets the tab bar scroll this tab to the top when its (already active) tab
 * is tapped again. No-op outside a TabBarProvider.
 */
export function useScrollToTop(tab: TabKey, fn: () => void) {
  const ctx = useContext(TabBarContext);
  const latest = useRef(fn);
  latest.current = fn;
  const register = ctx?.registerScrollToTop;
  useEffect(() => {
    if (!register) {
      return;
    }
    return register(tab, () => latest.current());
  }, [register, tab]);
}
