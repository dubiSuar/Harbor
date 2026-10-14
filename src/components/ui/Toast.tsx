import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, duration, ease, fonts, shadow } from '../../theme';
import { Icon, type IconName } from '../Icon';
import { useKeyboard } from '../useKeyboard';
import { useReduceMotion } from './motion';

/**
 * Where the toast sits (the design's `toastBottom`): 106 above the screen
 * bottom with the tab bar, 96 on Post and Chat (above the composer), 110 on
 * Create (above its toolbar), 90 on Story (above the reply row), 40
 * elsewhere, each shifted by the real bottom inset. App.tsx sets it from the
 * top route; screens never need to.
 */
export type ToastPlacement =
  | 'tabs'
  | 'composer'
  | 'create'
  | 'story'
  | 'default';

export type ToastOptions = {
  /** Leading icon (fill weight). Default 'check-circle'; null hides it. */
  icon?: IconName | null;
};

export type ToastApi = {
  /** Shows `message` for 2200 ms, replacing any toast on screen. */
  show: (message: string, options?: ToastOptions) => void;
};

type Internal = ToastApi & {
  setPlacement: (p: ToastPlacement) => void;
  setKeyboardBar: (height: number) => void;
};

const ToastContext = createContext<Internal | null>(null);

const NOOP: ToastApi = { show: () => {} };

/**
 * App-level toast. `useToast().show('Link copied')` from any screen; the
 * toast survives pushes, pops and the auth -> app stack switch.
 */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP;
}

/** App.tsx only: tells the toast which bottom offset to use. */
export function useToastPlacement() {
  return useContext(ToastContext)?.setPlacement;
}

/**
 * While the keyboard is up, the toast sits this much higher than the
 * keyboard's top: the height of the bar that rides on the keyboard (Post and
 * Chat composers, the Create toolbar, the Story reply row). Pass
 * `active = false` (e.g. while the screen is covered) to release it.
 */
export function useToastKeyboardBar(height: number, active = true) {
  const set = useContext(ToastContext)?.setKeyboardBar;
  useEffect(() => {
    if (!set || !active) {
      return;
    }
    set(height);
    return () => set(0);
  }, [set, height, active]);
}

const DESIGN_BOTTOM: Record<ToastPlacement, number> = {
  tabs: 106,
  composer: 96,
  create: 110,
  story: 90,
  default: 40,
};
/** The design frame's home-indicator allowance. */
const DESIGN_SAFE = 30;

type Shown = { id: number; message: string; icon: IconName | null };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboard();
  const reduce = useReduceMotion();
  const [shown, setShown] = useState<Shown | null>(null);
  const [placement, setPlacement] = useState<ToastPlacement>('default');
  const [keyboardBar, setKeyboardBar] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const show = useCallback((message: string, options?: ToastOptions) => {
    seq.current += 1;
    setShown({
      id: seq.current,
      message,
      icon: options?.icon === undefined ? 'check-circle' : options.icon,
    });
  }, []);

  useEffect(() => {
    if (!shown) {
      return;
    }
    anim.stopAnimation();
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: reduce ? 0 : duration.toast,
      easing: ease.smooth,
      useNativeDriver: true,
    }).start();
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    const id = shown.id;
    hideTimer.current = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: reduce ? 0 : duration.toastOut,
        easing: ease.css,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShown(s => (s?.id === id ? null : s));
        }
      });
    }, duration.toastHold);
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [shown, anim, reduce]);

  const value = useMemo(() => ({ show, setPlacement, setKeyboardBar }), [show]);
  const safe = Math.max(insets.bottom, 16);
  const bottom = keyboard.visible
    ? keyboard.height + keyboardBar + 12
    : DESIGN_BOTTOM[placement] - DESIGN_SAFE + safe;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {shown ? (
        <View
          pointerEvents="none"
          style={[styles.host, { bottom }]}
          accessibilityLiveRegion="polite"
        >
          <Animated.View
            accessible
            accessibilityRole="alert"
            accessibilityLabel={shown.message}
            style={[
              styles.toast,
              {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {shown.icon ? (
              <Icon
                name={shown.icon}
                weight="fill"
                size={18}
                color={colors.toastIcon}
              />
            ) : null}
            <Text style={styles.text} numberOfLines={1}>
              {shown.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 45,
    elevation: 45,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.toastBg,
    boxShadow: shadow.toast,
    maxWidth: '100%',
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.onAccent,
    flexShrink: 1,
  },
});
