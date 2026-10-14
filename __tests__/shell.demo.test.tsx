/**
 * The signed-in shell in demo mode: sign in, see the four tabs and the
 * create button, switch tabs.
 *
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { signIn, signOut } from '../src/services/auth';

jest.mock('../src/config', () => ({ DEMO_MODE: true, FEED_PAGE_SIZE: 20 }));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.setTimeout(30000);

async function settle(ms = 50) {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, ms));
  });
}

test('signs in to the tab shell and switches tabs', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await act(async () => {
    await signIn('noor@haddad.studio', 'harbor-demo');
  });
  await settle(800);

  const byLabel = (label: string) =>
    renderer.root.findAll(
      n => n.props.accessibilityLabel === label && n.props.onPress,
    );

  expect(byLabel('Create post').length).toBeGreaterThan(0);
  for (const label of ['Home', 'Explore', 'Brief', 'Profile']) {
    expect(byLabel(label).length).toBeGreaterThan(0);
  }

  await act(async () => {
    byLabel('Explore')[0].props.onPress();
  });
  await settle();
  const explore = byLabel('Explore')[0];
  expect(explore.props.accessibilityState).toMatchObject({ selected: true });

  await act(async () => {
    await signOut();
  });
  await settle();
  // Log out lands on SignIn (stacked over Welcome), not the onboarding pager.
  expect(byLabel('Forgot password').length).toBeGreaterThan(0);
  await act(async () => {
    renderer.unmount();
  });
});
