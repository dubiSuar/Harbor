/**
 * StackNavigator's double-push guard: a push while a screen is still
 * sliding in, or a push of the route already on top, is ignored.
 *
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  StackNavigator,
  sameRoute,
  useNav,
  type Route,
} from '../src/navigation/Navigator';

type Nav = ReturnType<typeof useNav>;
let nav!: Nav;

function Screen({ route }: { route: Route }) {
  nav = useNav();
  return <Text testID="screen">{JSON.stringify(route)}</Text>;
}

const renderScreen = (route: Route) => <Screen route={route} />;

/** Lets the (450 ms) enter animation finish. */
async function settle(ms = 700) {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, ms));
  });
}

let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
const screens = () =>
  renderer!.root.findAll(n => n.props.testID === 'screen' && n.type === Text)
    .length;

beforeEach(async () => {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <StackNavigator root={{ name: 'Tabs' }} renderScreen={renderScreen} />,
    );
  });
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
    renderer = undefined;
  });
});

test('a second tap while the first screen is entering is ignored', async () => {
  expect(screens()).toBe(1);
  await act(async () => {
    nav.push({ name: 'Post', postId: 'p1' });
    nav.push({ name: 'Post', postId: 'p2' });
    nav.push({ name: 'Messages' });
  });
  expect(screens()).toBe(2);

  // Once it has settled, a different route pushes as normal.
  await settle();
  await act(async () => nav.push({ name: 'Post', postId: 'p2' }));
  expect(screens()).toBe(3);
});

test('pushing the route already on top is ignored', async () => {
  await act(async () => nav.push({ name: 'User', userId: 'ines' }));
  await settle();
  await act(async () => nav.push({ name: 'User', userId: 'ines' }));
  await settle();
  expect(screens()).toBe(2);

  // Same name, other params: a new screen.
  await act(async () => nav.push({ name: 'User', userId: 'kofi' }));
  expect(screens()).toBe(3);
});

test('sameRoute compares the name and every param', () => {
  expect(sameRoute({ name: 'Messages' }, { name: 'Messages' })).toBe(true);
  expect(
    sameRoute({ name: 'Post', postId: 'p1' }, { name: 'Post', postId: 'p1' }),
  ).toBe(true);
  expect(
    sameRoute(
      { name: 'Post', postId: 'p1' },
      { name: 'Post', postId: 'p1', focusComment: true },
    ),
  ).toBe(false);
  expect(sameRoute({ name: 'Messages' }, { name: 'Settings' })).toBe(false);
});
