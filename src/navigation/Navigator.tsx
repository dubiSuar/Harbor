import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../components/ui/motion';
import { colors, duration, ease } from '../theme';

/**
 * A tiny stack navigator. Screens stay mounted underneath, so going back
 * keeps scroll position. Swap for React Navigation if the app outgrows it.
 *
 * Motion (DECISIONS #2, SPEC Appendix B):
 * - 'card' (default): hb-push, translateX 28 -> 0 + fade, 450 ms smooth.
 * - 'modal': hb-rise, translateY 56 -> 0 + fade, 500 ms smooth.
 * - 'fade': hb-fade, opacity only, 300 ms (the Story viewer).
 * Back reverses the same path with the same duration and curve. With the
 * OS "reduce motion" setting on, every transition is instant.
 */

export type Route =
  | { name: 'Welcome' }
  | { name: 'SignIn' }
  | { name: 'SignUp' }
  | { name: 'Tabs' }
  | { name: 'Post'; postId: string; focusComment?: boolean }
  | { name: 'NewPost'; initialText?: string; withPhoto?: boolean }
  | { name: 'User'; userId: string }
  | { name: 'EditProfile' }
  | { name: 'Settings' }
  /** Full-screen story viewer; index into useStories().stories. Push with 'fade'. */
  | { name: 'Story'; index: number }
  | { name: 'Messages' }
  | { name: 'Conversation'; chatId: string }
  | { name: 'Notifications' };

export type RouteName = Route['name'];

export type Presentation = 'card' | 'modal' | 'fade';

type Entry = {
  key: string;
  route: Route;
  presentation: Presentation;
  progress: Animated.Value;
};

type Nav = {
  push: (route: Route, presentation?: Presentation) => void;
  pop: () => void;
  replace: (route: Route) => void;
  /** Close a specific screen: animated if on top, instantly if covered. */
  dismiss: (key: string) => void;
  /** Back to the root screen (Tabs): animates the top out, drops the rest. */
  popToRoot: () => void;
  /**
   * Back to the nearest screen below the top with `route.name` (its params
   * are kept): the top animates out and the screens in between drop. When
   * no such screen is in the stack, pushes `route` instead. A no-op when
   * the top screen already has that name.
   */
  popTo: (route: Route, presentation?: Presentation) => void;
};

const NavContext = createContext<Nav | null>(null);
const ScreenKeyContext = createContext<string>('');
// Key of the top-most screen. Separate from NavContext so pushes and pops
// don't re-render every screen that only needs `nav`.
const TopKeyContext = createContext<string>('');
const TopRouteContext = createContext<Route | null>(null);
// Per-screen hardware-back overrides, keyed by screen key.
const BackGuardContext = createContext<Map<string, () => void> | null>(null);

/** Same screen and same params (shallow): a second push would duplicate it. */
export function sameRoute(a: Route, b: Route): boolean {
  if (a.name !== b.name) {
    return false;
  }
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
  for (const k of keys) {
    if (ra[k] !== rb[k]) {
      return false;
    }
  }
  return true;
}

let keySeq = 0;
const makeEntry = (
  route: Route,
  presentation: Presentation,
  shown: boolean,
) => ({
  key: `${route.name}-${keySeq++}`,
  route,
  presentation,
  progress: new Animated.Value(shown ? 1 : 0),
});

const ENTER: Record<
  Presentation,
  { duration: number; easing: (t: number) => number }
> = {
  card: { duration: duration.push, easing: ease.smooth },
  modal: { duration: duration.rise, easing: ease.smooth },
  fade: { duration: duration.fadeSm, easing: ease.css },
};

type Props = {
  root: Route;
  /**
   * Screens already stacked over `root` on mount, shown without animation
   * (Log out lands on SignIn over Welcome).
   */
  initialStack?: Route[];
  renderScreen: (route: Route) => React.ReactNode;
  /** Called whenever the top route changes (App.tsx places the toast with it). */
  onTopRouteChange?: (route: Route) => void;
};

export function StackNavigator({
  root,
  initialStack,
  renderScreen,
  onTopRouteChange,
}: Props) {
  const [stack, setStack] = useState<Entry[]>(() => [
    makeEntry(root, 'card', true),
    ...(initialStack ?? []).map(r => makeEntry(r, 'card', true)),
  ]);
  const reduce = useReduceMotion();
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  /** Enter timing for a presentation; exit runs the same path in reverse. */
  const timing = useCallback(
    (presentation: Presentation) =>
      reduceRef.current
        ? { duration: 0, easing: ENTER[presentation].easing }
        : ENTER[presentation],
    [],
  );
  const leaving = useRef(false);
  /** Key of the screen whose enter animation is still running. */
  const entering = useRef<string | null>(null);
  const stackRef = useRef(stack);
  const guards = useRef(new Map<string, () => void>());
  stackRef.current = stack;

  /**
   * Double-push guard: a second tap while a screen is still sliding in, or
   * a push of the route already on top (same name and params), is ignored.
   */
  const canPush = useCallback((route: Route) => {
    if (entering.current) {
      return false;
    }
    const current = stackRef.current;
    const top = current[current.length - 1];
    return !top || !sameRoute(top.route, route);
  }, []);

  /** Runs the enter animation, flagging the screen as entering meanwhile. */
  const enter = useCallback(
    (entry: Entry, after?: () => void) => {
      entering.current = entry.key;
      Animated.timing(entry.progress, {
        toValue: 1,
        useNativeDriver: true,
        ...timing(entry.presentation),
      }).start(() => {
        if (entering.current === entry.key) {
          entering.current = null;
        }
        after?.();
      });
    },
    [timing],
  );

  const push = useCallback(
    (route: Route, presentation: Presentation = 'card') => {
      if (!canPush(route)) {
        return;
      }
      const entry = makeEntry(route, presentation, false);
      // Updated now (not on the next render) so a push in the same tick
      // compares against this route.
      stackRef.current = [...stackRef.current, entry];
      setStack(prev => [...prev, entry]);
      enter(entry);
    },
    [canPush, enter],
  );

  // Push, then drop the screen underneath once it's covered.
  const replace = useCallback(
    (route: Route) => {
      if (!canPush(route)) {
        return;
      }
      const below = stackRef.current[stackRef.current.length - 1];
      const entry = makeEntry(route, 'card', false);
      stackRef.current = [...stackRef.current, entry];
      setStack(prev => [...prev, entry]);
      enter(entry, () => {
        setStack(s => (s.length > 2 ? s.filter(e => e.key !== below.key) : s));
      });
    },
    [canPush, enter],
  );

  const pop = useCallback(() => {
    if (leaving.current) {
      return;
    }
    const current = stackRef.current;
    if (current.length < 2) {
      return;
    }
    const top = current[current.length - 1];
    leaving.current = true;
    Animated.timing(top.progress, {
      toValue: 0,
      useNativeDriver: true,
      ...timing(top.presentation),
    }).start(() => {
      leaving.current = false;
      setStack(s => s.filter(e => e.key !== top.key));
    });
  }, [timing]);

  const popToRoot = useCallback(() => {
    const current = stackRef.current;
    if (current.length < 2 || leaving.current) {
      return;
    }
    const top = current[current.length - 1];
    // Covered screens go at once; the top one animates out over the root.
    setStack(s => s.filter((e, i) => i === 0 || e.key === top.key));
    leaving.current = true;
    Animated.timing(top.progress, {
      toValue: 0,
      useNativeDriver: true,
      ...timing(top.presentation),
    }).start(() => {
      leaving.current = false;
      setStack(s => s.filter(e => e.key !== top.key));
    });
  }, [timing]);

  const popTo = useCallback(
    (route: Route, presentation: Presentation = 'card') => {
      const current = stackRef.current;
      const top = current[current.length - 1];
      if (leaving.current || !top || top.route.name === route.name) {
        return;
      }
      let target = -1;
      for (let i = current.length - 2; i >= 0; i--) {
        if (current[i].route.name === route.name) {
          target = i;
          break;
        }
      }
      if (target < 0) {
        push(route, presentation);
        return;
      }
      // Covered screens above the target go at once; the top animates out.
      setStack(s => s.filter((e, i) => i <= target || e.key === top.key));
      leaving.current = true;
      Animated.timing(top.progress, {
        toValue: 0,
        useNativeDriver: true,
        ...timing(top.presentation),
      }).start(() => {
        leaving.current = false;
        setStack(s => s.filter(e => e.key !== top.key));
      });
    },
    [push, timing],
  );

  const dismiss = useCallback(
    (key: string) => {
      const current = stackRef.current;
      if (current[current.length - 1]?.key === key) {
        pop();
      } else if (current.findIndex(e => e.key === key) > 0) {
        setStack(s => s.filter(e => e.key !== key));
      }
    },
    [pop],
  );

  // Registered once. With a single screen on the stack it never handles the
  // press, so a root screen's own handler (e.g. MainTabs going back to Home)
  // or the system (leave the app) gets it, whatever the registration order.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const current = stackRef.current;
      if (current.length < 2) {
        return false;
      }
      const top = current[current.length - 1];
      const guard = guards.current.get(top.key);
      if (guard) {
        guard();
      } else {
        pop();
      }
      return true;
    });
    return () => sub.remove();
  }, [pop]);

  // Stable for the navigator's lifetime: consumers (every PostCard) never
  // re-render because the stack changed.
  const nav = useMemo(
    () => ({ push, pop, replace, dismiss, popToRoot, popTo }),
    [push, pop, replace, dismiss, popToRoot, popTo],
  );
  const topEntry = stack[stack.length - 1];
  const topKey = topEntry?.key ?? '';
  const topRoute = topEntry?.route ?? null;
  const onTopRef = useRef(onTopRouteChange);
  onTopRef.current = onTopRouteChange;
  useEffect(() => {
    if (topRoute) {
      onTopRef.current?.(topRoute);
    }
  }, [topRoute]);

  return (
    <NavContext.Provider value={nav}>
      <TopKeyContext.Provider value={topKey}>
        <TopRouteContext.Provider value={topRoute}>
          <BackGuardContext.Provider value={guards.current}>
            <View style={styles.root}>
              {stack.map((entry, i) => {
                const isTop = i === stack.length - 1;
                const p = entry.progress;
                const motion =
                  i === 0
                    ? null
                    : {
                        opacity: p,
                        transform:
                          entry.presentation === 'modal'
                            ? [
                                {
                                  translateY: p.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [56, 0],
                                  }),
                                },
                              ]
                            : entry.presentation === 'card'
                            ? [
                                {
                                  translateX: p.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [28, 0],
                                  }),
                                },
                              ]
                            : [],
                      };
                return (
                  <Animated.View
                    key={entry.key}
                    pointerEvents={isTop ? 'auto' : 'none'}
                    accessibilityElementsHidden={!isTop}
                    importantForAccessibility={
                      isTop ? 'auto' : 'no-hide-descendants'
                    }
                    style={[StyleSheet.absoluteFill, styles.screen, motion]}
                  >
                    <ScreenKeyContext.Provider value={entry.key}>
                      {renderScreen(entry.route)}
                    </ScreenKeyContext.Provider>
                  </Animated.View>
                );
              })}
            </View>
          </BackGuardContext.Provider>
        </TopRouteContext.Provider>
      </TopKeyContext.Provider>
    </NavContext.Provider>
  );
}

/**
 * Replace the Android hardware-back behaviour for this screen while it is
 * mounted, e.g. to confirm before discarding a draft. The handler decides
 * whether to pop.
 */
export function useBackOverride(handler: () => void) {
  const guards = useContext(BackGuardContext);
  const key = useContext(ScreenKeyContext);
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!guards || !key) {
      return;
    }
    guards.set(key, () => latest.current());
    return () => {
      guards.delete(key);
    };
  }, [guards, key]);
}

/** Stable key of the screen this component renders inside. */
export function useScreenKey() {
  return useContext(ScreenKeyContext);
}

/** True while the screen this component renders inside is the top one. */
export function useIsTopScreen() {
  const key = useContext(ScreenKeyContext);
  const top = useContext(TopKeyContext);
  return !!key && key === top;
}

/** The route on top of the stack (null outside a navigator). */
export function useTopRoute(): Route | null {
  return useContext(TopRouteContext);
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNav must be used inside StackNavigator');
  }
  return ctx;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screen: { backgroundColor: colors.bg },
});
