import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
} from 'react-native';

export type KeyboardInfo = { visible: boolean; height: number };

const HIDDEN: KeyboardInfo = { visible: false, height: 0 };

/**
 * How much of the screen's bottom edge the keyboard covers, in dp.
 *
 * Android (RN 0.87): `endCoordinates.height` leaves out the navigation bar,
 * and the app is edge-to-edge, so bottom-anchored UI sat one nav-bar height
 * too low. The distance from the keyboard's top (`screenY`) to the bottom
 * of the screen includes it. iOS reports the full height already.
 */
export function keyboardCover(e: KeyboardEvent): number {
  const { height, screenY } = e.endCoordinates;
  if (Platform.OS !== 'android') {
    return height;
  }
  const cover = Dimensions.get('screen').height - screenY;
  // Guard against odd reports (floating / split keyboards, 0 screenY).
  return cover > 0 && cover >= height ? cover : height;
}

/**
 * Whether the software keyboard is up, and how much of the screen bottom it
 * covers (see `keyboardCover`).
 *
 * iOS reports the "will" events, so layout moves together with the keyboard;
 * Android only has the "did" events. The app runs edge-to-edge on Android, so
 * the window is not resized for us and screens use this to drop their
 * bottom safe-area padding and lift floating UI (toasts) above the keyboard.
 */
export function useKeyboard(): KeyboardInfo {
  const [info, setInfo] = useState<KeyboardInfo>(HIDDEN);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) =>
      setInfo({ visible: true, height: keyboardCover(e) });
    const onHide = () => setInfo(HIDDEN);
    const show = Keyboard.addListener(showEvent, onShow);
    const hide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return info;
}

/** True while the software keyboard is on screen. */
export function useKeyboardVisible(): boolean {
  return useKeyboard().visible;
}
