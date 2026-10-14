import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { useReduceMotion } from '../components/ui';
import { PaneVisibleContext } from '../navigation/PaneVisibleContext';
import { useIsTopScreen, useNav } from '../navigation/Navigator';
import { useTabBar, type TabKey } from '../navigation/TabBarContext';
import { useStore } from '../state/StoreContext';
import { colors, duration, ease } from '../theme';
import { BriefScreen } from './BriefScreen';
import { ExploreScreen } from './ExploreScreen';
import { HomeScreen } from './HomeScreen';
import { ProfileScreen } from './ProfileScreen';

/**
 * The four tabs (SPEC 4.1): Home, Explore, Brief, Profile. All stay
 * mounted so each keeps its scroll position; the bar floats over them and
 * each screen pads its own bottom with `useTabBarClearance()`. The tab
 * state lives in TabBarProvider (App.tsx) so pushed screens can switch it
 * with `useTabs()`.
 */
export function MainTabs() {
  const { tab, setTab, scrollToTop } = useTabBar();
  const { getUser, meId } = useStore();
  const nav = useNav();
  const isTop = useIsTopScreen();
  const me = getUser(meId);

  const change = (next: TabKey) => {
    if (next === tab) {
      scrollToTop(next);
    } else {
      setTab(next);
    }
  };

  // Android back on Explore, Brief or Profile goes to Home first; on Home it
  // falls through and leaves the app. Only while the tabs are the top
  // screen: with a screen pushed on top, the navigator pops that instead.
  const state = useRef({ tab, isTop });
  state.current = { tab, isTop };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const { tab: current, isTop: top } = state.current;
      if (!top || current === 'home') {
        return false;
      }
      setTab('home');
      return true;
    });
    return () => sub.remove();
  }, [setTab]);

  return (
    <View style={styles.flex}>
      <Pane visible={tab === 'home'}>
        <HomeScreen />
      </Pane>
      <Pane visible={tab === 'explore'}>
        <ExploreScreen />
      </Pane>
      <Pane visible={tab === 'brief'}>
        <BriefScreen />
      </Pane>
      <Pane visible={tab === 'profile'}>
        <ProfileScreen />
      </Pane>
      <FloatingTabBar
        active={tab}
        onChange={change}
        onCreate={() => nav.push({ name: 'NewPost' }, 'modal')}
        avatarUri={me.photoUrl}
        avatarName={me.name}
      />
    </View>
  );
}

/** A tab pane: hidden panes are off-screen; showing one fades it in (`hb-fade .35s`). */
function Pane({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      return;
    }
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration: reduce ? 0 : duration.fade,
      easing: ease.css,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [visible, reduce, opacity]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }, !visible && styles.hidden]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    >
      <PaneVisibleContext.Provider value={visible}>
        {children}
      </PaneVisibleContext.Provider>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  // Off-screen as well as transparent: Android paints elevation shadows
  // even at opacity 0, so hidden panes could ghost through otherwise.
  hidden: { transform: [{ translateX: 10000 }] },
});
