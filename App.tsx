/**
 * Harbor
 *
 * @format
 */

import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/ui';
import { useToastPlacement } from './src/components/ui/Toast';
import { Route, StackNavigator } from './src/navigation/Navigator';
import { TabBarProvider, useTabs } from './src/navigation/TabBarContext';
import { ConversationScreen } from './src/screens/ConversationScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { MainTabs } from './src/screens/MainTabs';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { NewPostScreen } from './src/screens/NewPostScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { PostScreen } from './src/screens/PostScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { StoryScreen } from './src/screens/StoryScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { SocialProvider } from './src/state/SocialContext';
import { StoreProvider } from './src/state/StoreContext';
import { colors } from './src/theme';

function renderScreen(route: Route): React.ReactNode {
  switch (route.name) {
    case 'Welcome':
      return <WelcomeScreen />;
    case 'SignIn':
      return <SignInScreen />;
    case 'SignUp':
      return <SignUpScreen />;
    case 'Tabs':
      return <MainTabs />;
    case 'Post':
      return (
        <PostScreen postId={route.postId} focusComment={route.focusComment} />
      );
    case 'NewPost':
      return (
        <NewPostScreen
          initialText={route.initialText}
          withPhoto={route.withPhoto}
        />
      );
    case 'User':
      return <UserProfileScreen userId={route.userId} />;
    case 'EditProfile':
      return <EditProfileScreen />;
    case 'Settings':
      return <SettingsScreen />;
    case 'Story':
      return <StoryScreen index={route.index} />;
    case 'Messages':
      return <MessagesScreen />;
    case 'Conversation':
      return <ConversationScreen chatId={route.chatId} />;
    case 'Notifications':
      return <NotificationsScreen />;
  }
}

/**
 * The design's `toastBottom`: above the tab bar, above a composer, above
 * Create's toolbar or Story's reply row, or low.
 */
function placementFor(route: Route) {
  switch (route.name) {
    case 'Tabs':
      return 'tabs' as const;
    case 'Post':
    case 'Conversation':
      return 'composer' as const;
    case 'NewPost':
      return 'create' as const;
    case 'Story':
      return 'story' as const;
    default:
      return 'default' as const;
  }
}

/** White status bar on Story and the Profile tab, dark elsewhere (SPEC 0). */
function AppStatusBar({ top }: { top: Route | null }) {
  const { tab } = useTabs();
  const light =
    top?.name === 'Story' ||
    top?.name === 'User' ||
    (top?.name === 'Tabs' && tab === 'profile');
  return (
    <StatusBar barStyle={light ? 'light-content' : 'dark-content'} animated />
  );
}

/** Log out lands on SignIn over Welcome (SPEC 3.14); a cold start on Welcome. */
const AFTER_SIGN_OUT: Route[] = [{ name: 'SignIn' }];

function Root() {
  const { user, initializing } = useAuth();
  // True once this app session has been signed in, so a later sign-out
  // opens the auth stack at SignIn instead of the onboarding pager.
  const wasSignedIn = useRef(false);
  if (user) {
    wasSignedIn.current = true;
  }
  const setPlacement = useToastPlacement();
  const [top, setTop] = useState<Route | null>(null);
  const onTop = useCallback(
    (route: Route) => {
      setTop(route);
      setPlacement?.(placementFor(route));
    },
    [setPlacement],
  );

  if (initializing) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.muted} />
      </View>
    );
  }
  // Keyed by auth state so signing in or out starts a fresh stack (and a
  // fresh store, social state and tab).
  return user ? (
    <StoreProvider>
      <SocialProvider>
        <TabBarProvider>
          <AppStatusBar top={top} />
          <StackNavigator
            key="app"
            root={{ name: 'Tabs' }}
            renderScreen={renderScreen}
            onTopRouteChange={onTop}
          />
        </TabBarProvider>
      </SocialProvider>
    </StoreProvider>
  ) : (
    <StackNavigator
      key="auth"
      root={{ name: 'Welcome' }}
      initialStack={wasSignedIn.current ? AFTER_SIGN_OUT : undefined}
      renderScreen={renderScreen}
      onTopRouteChange={onTop}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ToastProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
