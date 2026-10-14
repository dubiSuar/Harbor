import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** False while the app is in the background (the story timer pauses). */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  return active;
}
