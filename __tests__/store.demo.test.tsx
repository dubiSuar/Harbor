/**
 * Drives StoreProvider against the offline demo backend (DEMO_MODE) with a
 * small page size, through the real store logic: likes, comments, posts,
 * follows and feed paging.
 *
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AuthProvider } from '../src/state/AuthContext';
import { StoreProvider, useStore } from '../src/state/StoreContext';
import type { StoreValue } from '../src/state/storeTypes';

jest.mock('../src/config', () => ({ DEMO_MODE: true, FEED_PAGE_SIZE: 3 }));

jest.setTimeout(30000);

let store: StoreValue;

function Probe() {
  store = useStore();
  return null;
}

/** Polls (inside act) until `check` passes. */
async function waitFor(check: () => boolean, label: string, timeout = 5000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timed out waiting for: ${label}`);
    }
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 20));
    });
  }
}

/**
 * Starts loadMore() inside act but awaits it outside: React only commits the
 * grown window (and re-subscribes) once the act callback has returned.
 */
async function loadMore() {
  let done: Promise<void> = Promise.resolve();
  await act(async () => {
    done = store.loadMore();
  });
  let settled = false;
  done.then(
    () => (settled = true),
    () => (settled = true),
  );
  // Well under the store's 10 s fallback: the grown window really arrived.
  await waitFor(() => settled, 'loadMore settled', 3000);
  await done;
}

const ids = () => store.posts.map(p => p.id);
const post = (id: string) => store.posts.find(p => p.id === id);

let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

async function mount() {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthProvider>
        <StoreProvider>
          <Probe />
        </StoreProvider>
      </AuthProvider>,
    );
  });
  await waitFor(() => store.feedState === 'ready', 'feed ready');
}

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
    renderer = undefined;
    // Let the deferred backend.dispose() run.
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });
});

test('likes, comments, posts, follows and paging work end to end', async () => {
  await mount();
  expect(ids()).toEqual(['p1', 'p2', 'p3']);
  expect(store.hasMore).toBe(true);
  expect(store.summary.count).toBeGreaterThan(0);
  expect(['today', 'week']).toContain(store.summary.period);

  // Like, then unlike.
  const before = post('p1')!;
  expect(before.likedByMe).toBe(false);
  await act(() => store.toggleLike('p1'));
  await waitFor(
    () =>
      post('p1')?.likedByMe === true &&
      post('p1')?.likeCount === before.likeCount + 1,
    'p1 liked',
  );
  await act(() => store.toggleLike('p1'));
  await waitFor(
    () =>
      post('p1')?.likedByMe === false &&
      post('p1')?.likeCount === before.likeCount,
    'p1 unliked',
  );

  // Comment.
  await act(() => store.addComment('p1', 'Looks great'));
  await waitFor(
    () => post('p1')?.commentCount === before.commentCount + 1,
    'comment counted',
  );

  // Load more: the window grows to two pages.
  await loadMore();
  await waitFor(() => ids().length === 6, 'second page');
  expect(ids()).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
  expect(store.hasMore).toBe(false);

  // Create a post, then delete it.
  await act(() => store.createPost({ text: 'Hello from the test' }));
  await waitFor(
    () =>
      store.posts[0]?.text === 'Hello from the test' &&
      !store.posts[0]?.pending,
    'new post in feed',
  );
  const created = store.posts[0].id;
  await act(() => store.deletePost(created));
  await waitFor(
    () => !ids().includes(created) && ids().length === 6,
    'post deleted',
  );

  // Follow, then unfollow.
  await waitFor(() => store.followingState === 'ready', 'following loaded');
  expect(store.following.ines).toBeFalsy();
  await act(() => store.toggleFollow('ines'));
  await waitFor(() => store.following.ines === true, 'following ines');
  await act(() => store.toggleFollow('ines'));
  await waitFor(() => !store.following.ines, 'unfollowed ines');

  // Activity loaded and reported its state.
  await waitFor(() => store.activityState === 'ready', 'activity loaded');
});

test('a new post after loadMore does not open a gap in the feed', async () => {
  await mount();
  await loadMore();
  await waitFor(() => ids().length === 6, 'second page');
  const loaded = ids();

  await act(() => store.createPost({ text: 'Breaking news' }));
  await waitFor(
    () => store.posts[0]?.text === 'Breaking news' && !store.posts[0]?.pending,
    'new post in feed',
  );
  const fresh = store.posts[0].id;

  // Newest first and contiguous: the new post, then everything that was on
  // screen except the oldest, which moved past the window and is next.
  expect(ids()).toEqual([fresh, ...loaded.slice(0, 5)]);
  expect(store.hasMore).toBe(true);

  await loadMore();
  await waitFor(() => ids().length === 7, 'third page');
  expect(ids()).toEqual([fresh, ...loaded]);
});
