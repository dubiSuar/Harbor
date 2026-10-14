import { useCallback } from 'react';
import { useStore } from '../state/StoreContext';
import { useNav } from './Navigator';
import { useGoToTab } from './TabBarContext';

/**
 * A stable `(userId) => void` that opens a person's profile from anywhere:
 * someone else's pushes `User`; my own goes back to the Profile tab (the
 * design's `tab('profile')`, which clears the stack). Pass it straight to
 * memoised cards as their `onAuthor`.
 */
export function useOpenProfile() {
  const nav = useNav();
  const goToTab = useGoToTab();
  const { isMe } = useStore();
  return useCallback(
    (userId: string) => {
      if (!userId) {
        return;
      }
      if (isMe(userId)) {
        goToTab('profile');
      } else {
        nav.push({ name: 'User', userId });
      }
    },
    [nav, goToTab, isMe],
  );
}
