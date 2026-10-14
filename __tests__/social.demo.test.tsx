/**
 * SocialContext on demo data: friend requests, chats (with the canned
 * reply), groups, notifications and the AI-backed Brief.
 *
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AuthProvider } from '../src/state/AuthContext';
import {
  SocialProvider,
  useBrief,
  useChat,
  useChats,
  useFriends,
  useGroups,
  useMe,
  useNotifications,
  usePeopleSearch,
} from '../src/state/SocialContext';
import { filterChats } from '../src/components/social/ChatRow';
import { pic, users as seedUsers } from '../src/data/mock';
import { StoreProvider, useStore } from '../src/state/StoreContext';

jest.mock('../src/config', () => ({ DEMO_MODE: true, FEED_PAGE_SIZE: 20 }));

jest.setTimeout(30000);

type Hooks = {
  friends: ReturnType<typeof useFriends>;
  chats: ReturnType<typeof useChats>;
  chat: ReturnType<typeof useChat>;
  groups: ReturnType<typeof useGroups>;
  notifications: ReturnType<typeof useNotifications>;
  brief: ReturnType<typeof useBrief>;
  search: ReturnType<typeof usePeopleSearch>;
  blank: ReturnType<typeof usePeopleSearch>;
  me: ReturnType<typeof useMe>;
  store: ReturnType<typeof useStore>;
};

let h: Hooks;

function Probe() {
  h = {
    friends: useFriends(),
    chats: useChats(),
    chat: useChat('c2'),
    groups: useGroups(),
    notifications: useNotifications(),
    brief: useBrief(),
    search: usePeopleSearch(' HANA '),
    blank: usePeopleSearch('   '),
    me: useMe(),
    store: useStore(),
  };
  return null;
}

async function waitFor(check: () => boolean, label: string, timeout = 5000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timed out waiting for: ${label}`);
    }
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 25));
    });
  }
}

let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

beforeEach(async () => {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthProvider>
        <StoreProvider>
          <SocialProvider>
            <Probe />
          </SocialProvider>
        </StoreProvider>
      </AuthProvider>,
    );
  });
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
    renderer = undefined;
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });
});

test('accepting a friend request makes a friend and updates the notification', async () => {
  expect(h.friends.statusOf('yusuf')).toBe('incoming');
  expect(h.friends.pendingRequests).toHaveLength(1);
  const before = h.friends.friendCount;
  const n3 = () => h.notifications.items.find(n => n.id === 'n3')!;
  expect(n3().requestState).toBe('pending');

  await act(async () => h.friends.acceptRequest('r-yusuf'));

  expect(h.friends.statusOf('yusuf')).toBe('friend');
  expect(h.friends.pendingRequests).toHaveLength(0);
  expect(h.friends.friendCount).toBe(before + 1);
  expect(n3().requestState).toBe('accepted');
  expect(n3().text).toBe('is now your friend.');

  // Add friend from search toggles requested / none.
  await act(async () => {
    expect(h.friends.toggleRequest('wren')).toBe('requested');
  });
  expect(h.friends.statusOf('wren')).toBe('requested');
});

test('sending a chat message clears smart replies, then the canned reply arrives', async () => {
  const start = h.chat.chat!.messages.length;
  expect(h.chat.smartReplies.length).toBeGreaterThan(0);

  await act(async () => h.chat.send('  Can we do 7?  '));

  const sent = h.chat.chat!;
  expect(sent.messages).toHaveLength(start + 1);
  expect(sent.messages[sent.messages.length - 1]).toMatchObject({
    fromMe: true,
    text: 'Can we do 7?',
  });
  expect(sent.typing).toBe(true);
  expect(h.chat.smartReplies).toEqual([]);

  await waitFor(() => h.chat.chat!.typing === false, 'canned reply', 4000);
  const done = h.chat.chat!;
  expect(done.messages).toHaveLength(start + 2);
  expect(done.messages[done.messages.length - 1]).toMatchObject({
    fromMe: false,
    text: 'Great, 7 it is.',
  });

  // Opening an unread chat marks it read.
  expect(h.chats.unreadCount).toBe(1);
  await act(async () => h.chats.markRead('c1'));
  expect(h.chats.unreadCount).toBe(0);
});

test('joining and leaving a group, and marking notifications read', async () => {
  const film = h.groups.groups[0];
  expect(h.groups.isJoined(film.id)).toBe(false);
  await act(async () => {
    expect(h.groups.toggleJoin(film.id)).toBe(true);
  });
  expect(h.groups.isJoined(film.id)).toBe(true);
  await act(async () => {
    expect(h.groups.toggleJoin(film.id)).toBe(false);
  });
  expect(h.groups.isJoined(film.id)).toBe(false);

  expect(h.notifications.unreadCount).toBe(4);
  await act(async () => h.notifications.markAllRead());
  expect(h.notifications.unreadCount).toBe(0);
  expect(h.notifications.fresh.every(n => !n.unread)).toBe(true);
});

test('the Brief regenerates from mock data with a loading state', async () => {
  expect(h.brief.today).toHaveLength(3);
  let done: Promise<void> = Promise.resolve();
  await act(async () => {
    done = h.brief.regenerate();
  });
  expect(h.brief.loading).toBe(true);
  await waitFor(() => !h.brief.loading, 'brief loaded', 4000);
  await done;
  expect(h.brief.today).toHaveLength(3);
  h.brief.today.forEach(item => expect(item.text.length).toBeGreaterThan(0));
});

test('people search and the profile persona', async () => {
  expect(h.search.map(u => u.id)).toEqual(['hana']);
  expect(h.blank).toEqual([]);
  expect(h.me.coverUrl).toContain('hb-rotterdam-cover');
  expect(h.me.about).toHaveLength(5);
  // My seed posts' photos (newest first), then the persona's 12.
  await waitFor(() => h.me.photos?.length === 14, 'my post photos');
  expect(h.me.photos?.slice(0, 2)).toEqual([
    pic('hb-me-bridge', 900, 675),
    pic('hb-me-bread', 900, 675),
  ]);
  expect(h.me.photos?.slice(2)).toEqual(seedUsers.me.photos);
  expect(h.me.postsCount).toBe(seedUsers.me.postsCount);
});

test('a new post puts its photo first on my profile and counts it', async () => {
  await waitFor(() => h.me.photos?.length === 14, 'my post photos');
  const uri = 'file:///tmp/harbor-new-post.jpg';
  await act(() =>
    h.store.createPost({
      text: 'Fresh from the test',
      image: { uri, width: 900, height: 675 },
    }),
  );
  await waitFor(() => h.me.photos?.[0] === uri, 'new photo first', 4000);
  expect(h.me.photos).toHaveLength(15);
  expect(h.me.postsCount).toBe((seedUsers.me.postsCount ?? 0) + 1);
  // My display user is memoised: the same object until something changes.
  const before = h.me;
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 20));
  });
  expect(h.me).toBe(before);
});

test('sending a message moves the chat to the top as "now"', async () => {
  expect(h.chats.chats[0].id).not.toBe('c2');
  await act(async () => h.chat.send('On my way'));
  expect(h.chats.chats[0]).toMatchObject({ id: 'c2', timeLabel: 'now' });
  await waitFor(() => h.chat.chat!.typing === false, 'canned reply', 4000);
  expect(h.chats.chats[0]).toMatchObject({ id: 'c2', timeLabel: 'now' });
});

test('Messages search filters chats by the peer name', () => {
  const nameOf = (id: string) => seedUsers[id]?.name ?? '';
  const chats = h.chats.chats;
  expect(filterChats(chats, '', nameOf)).toBe(chats);
  expect(filterChats(chats, '  ', nameOf)).toBe(chats);
  expect(filterChats(chats, ' HANA ', nameOf).map(c => c.peerId)).toEqual([
    'hana',
  ]);
  expect(filterChats(chats, 'zzz', nameOf)).toEqual([]);
});
