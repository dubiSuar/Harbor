import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Header,
  Icon,
  ListGroup,
  ListRow,
  Overline,
  PressableScale,
  ToggleRow,
  useToast,
} from '../components/ui';
import { aiSettingRows, privacyRows, settingsShortcuts } from '../data/social';
import { useNav } from '../navigation/Navigator';
import { useGoToTab } from '../navigation/TabBarContext';
import { useAuth } from '../state/AuthContext';
import { useAISettings, useMe } from '../state/SocialContext';
import { colors, fonts, type } from '../theme';

/** The design's "Menu" screen (SPEC 3.14), route `Settings`. */
export function SettingsScreen() {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const goToTab = useGoToTab();
  const me = useMe();
  const { settings, set } = useAISettings();
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  const logOut = () =>
    Alert.alert('Log out of Harbor?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            await signOut();
          } catch {
            setLeaving(false);
            toast.show("Couldn't log out. Try again.", {
              icon: 'warning-circle',
            });
          }
        },
      },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 10,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Header variant="large" title="Menu" onBack={nav.pop} />

      <PressableScale
        onPress={() => goToTab('profile')}
        pressedScale={0.99}
        accessibilityLabel={`${me.name}, See your profile`}
        style={styles.card}
      >
        <Avatar uri={me.photoUrl} name={me.name} size={50} />
        <View style={styles.cardText}>
          <Text style={type.rowTitle} numberOfLines={1}>
            {me.name}
          </Text>
          <Text style={styles.cardSub}>See your profile</Text>
        </View>
        <Icon name="caret-right" size={16} color={colors.faint} />
      </PressableScale>

      <View style={styles.shortcuts}>
        {settingsShortcuts.map(s => (
          <PressableScale
            key={s.label}
            onPress={() => toast.show(`${s.label} opens here`)}
            pressedScale={0.97}
            accessibilityLabel={s.label}
            style={styles.tile}
          >
            <Icon name={s.icon} size={24} color={colors.accent} />
            <Text style={styles.tileLabel}>{s.label}</Text>
          </PressableScale>
        ))}
      </View>

      <Overline padding={{ horizontal: 28 }}>Harbor AI</Overline>
      <ListGroup>
        {aiSettingRows.map((r, i) => (
          <ToggleRow
            key={r.key}
            label={r.label}
            sub={r.sub}
            value={settings[r.key]}
            onValueChange={v => set(r.key, v)}
            last={i === aiSettingRows.length - 1}
          />
        ))}
      </ListGroup>

      <Overline padding={{ horizontal: 28 }}>Privacy</Overline>
      <ListGroup>
        {privacyRows.map((r, i) => (
          <ListRow
            key={r.label}
            icon={r.icon}
            label={r.label}
            value={r.value}
            onPress={() => toast.show(`${r.label} opens here`)}
            last={i === privacyRows.length - 1}
          />
        ))}
      </ListGroup>

      <Button
        variant="dangerText"
        size="block"
        label="Log out"
        loading={leaving}
        onPress={logOut}
        style={styles.logout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill },
  card: {
    marginTop: 14,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.bg,
  },
  cardText: { flex: 1 },
  cardSub: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.bg,
  },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  logout: { marginTop: 22, marginHorizontal: 16 },
});
