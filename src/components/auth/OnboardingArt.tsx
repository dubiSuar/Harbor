import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts, shadow } from '../../theme';
import { Avatar, Icon } from '../ui';

/** The design's art box (SPEC 3.01): 390x350, children absolute. */
export const ART_W = 390;
export const ART_H = 350;

const PIC = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/**
 * A cover-fit photo clipped by a wrapper (per-corner radii and a
 * border-box white border), with the #E4E4E7 placeholder.
 */
function Photo({ uri, box }: { uri: string; box: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.photo, box]}>
      <Image
        source={{ uri }}
        style={styles.fill as ImageStyle}
        resizeMode="cover"
      />
    </View>
  );
}

/** Appendix A "ob1" backdrop. */
function Ob1Svg() {
  return (
    <Svg
      width={ART_W}
      height={ART_H}
      viewBox="0 0 390 350"
      style={StyleSheet.absoluteFill}
    >
      <Path
        d="M24 300c30-44 90-44 120 0"
        fill="none"
        stroke={colors.accent}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Path
        d="M290 40c18 0 30 12 30 30"
        fill="none"
        stroke={colors.accent}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Circle cx={352} cy={128} r={9} fill={colors.sunny} />
      <Circle cx={60} cy={40} r={5} fill={colors.accent} />
    </Svg>
  );
}

/** Appendix A "ob2" backdrop. */
function Ob2Svg() {
  return (
    <Svg
      width={ART_W}
      height={ART_H}
      viewBox="0 0 390 350"
      style={StyleSheet.absoluteFill}
    >
      <Path
        d="M330 300l6-18 6 18 18 6-18 6-6 18-6-18-18-6z"
        fill={colors.sunny}
      />
      <Path
        d="M30 60c0-16 13-28 28-28"
        fill="none"
        stroke={colors.accent}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Circle cx={46} cy={312} r={6} fill={colors.accent} />
    </Svg>
  );
}

/** Appendix A "ob3" backdrop (includes the r150 #EEF2FD circle). */
function Ob3Svg() {
  return (
    <Svg
      width={ART_W}
      height={ART_H}
      viewBox="0 0 390 350"
      style={StyleSheet.absoluteFill}
    >
      <Circle cx={195} cy={180} r={150} fill={colors.accentSoft} />
      <Path
        d="M330 56l5-15 5 15 15 5-15 5-5 15-5-15-15-5z"
        fill={colors.accent}
      />
      <Path d="M40 290l3-9 3 9 9 3-9 3-3 9-3-9-9-3z" fill={colors.sunny} />
      <Path
        d="M300 300c20 0 36-10 44-26"
        fill="none"
        stroke={colors.accent}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Page 1: picnic arch, harbour circle, table pill, "Hana and 23 others". */
function Page1() {
  return (
    <>
      <Ob1Svg />
      <Photo
        uri={PIC('hb-ob-picnic', 400, 620)}
        box={[
          styles.abs,
          {
            left: 44,
            top: 28,
            width: 160,
            height: 250,
            borderTopLeftRadius: 80,
            borderTopRightRadius: 80,
            borderBottomRightRadius: 28,
            borderBottomLeftRadius: 28,
          },
        ]}
      />
      <Photo
        uri={PIC('hb-ob-harbour', 400, 400)}
        box={[
          styles.abs,
          {
            left: 176,
            top: 62,
            width: 148,
            height: 148,
            borderRadius: 74,
            borderWidth: 6,
            borderColor: colors.bg,
          },
        ]}
      />
      <Photo
        uri={PIC('hb-ob-table', 500, 260)}
        box={[
          styles.abs,
          { left: 208, top: 226, width: 150, height: 72, borderRadius: 36 },
        ]}
      />
      <View style={styles.likeChip}>
        <View style={styles.likeDot}>
          <Icon name="heart" weight="fill" size={12} color={colors.onAccent} />
        </View>
        <Text style={styles.likeText}>Hana and 23 others</Text>
      </View>
    </>
  );
}

/** Page 2: album collage and the "12 photos" tile. */
function Page2() {
  return (
    <>
      <Ob2Svg />
      <Photo
        uri={PIC('hb-ob-coast', 520, 640)}
        box={[
          styles.abs,
          { left: 36, top: 34, width: 176, height: 214, borderRadius: 36 },
        ]}
      />
      <Photo
        uri={PIC('hb-ob-market', 400, 220)}
        box={[
          styles.abs,
          {
            left: 222,
            top: 34,
            width: 134,
            height: 74,
            borderTopLeftRadius: 67,
            borderTopRightRadius: 67,
          },
        ]}
      />
      <Photo
        uri={PIC('hb-ob-bike', 400, 400)}
        box={[
          styles.abs,
          { left: 222, top: 114, width: 134, height: 134, borderRadius: 67 },
        ]}
      />
      <Photo
        uri={PIC('hb-ob-bread', 400, 220)}
        box={[
          styles.abs,
          {
            left: 36,
            top: 256,
            width: 176,
            height: 66,
            borderBottomRightRadius: 33,
            borderBottomLeftRadius: 33,
          },
        ]}
      />
      <View style={styles.photosTile}>
        <Icon name="images" size={18} color={colors.onAccent} />
        <Text style={styles.photosText}>12 photos</Text>
      </View>
    </>
  );
}

const BRIEF_LINES = [
  {
    uri: 'https://i.pravatar.cc/80?img=32',
    text: 'Ines shared her pastéis de nata recipe.',
  },
  {
    uri: 'https://i.pravatar.cc/80?img=12',
    text: "Tomasz's library survey closes Wednesday.",
  },
  {
    uri: 'https://i.pravatar.cc/80?img=45',
    text: "Priya's hike is today's most-liked post.",
  },
];

/** Page 3: hike circle and the centred Harbor Brief card. */
function Page3() {
  return (
    <>
      <Ob3Svg />
      <Photo
        uri={PIC('hb-ob-hike', 300, 300)}
        box={[
          styles.abs,
          {
            left: 30,
            top: 40,
            width: 84,
            height: 84,
            borderRadius: 42,
            borderWidth: 5,
            borderColor: colors.bg,
          },
        ]}
      />
      <View style={styles.center} pointerEvents="none">
        <View style={styles.briefCard}>
          <View style={styles.briefHead}>
            <View style={styles.briefBadge}>
              <Icon
                name="sparkle"
                weight="fill"
                size={15}
                color={colors.onAccent}
              />
            </View>
            <View>
              <Text style={styles.briefTitle}>Harbor Brief</Text>
              <Text style={styles.briefMeta}>Since 7:40 AM · 23 posts</Text>
            </View>
          </View>
          <View style={styles.briefLines}>
            {BRIEF_LINES.map(l => (
              <View key={l.uri} style={styles.briefLine}>
                <Avatar uri={l.uri} size={20} />
                <Text style={styles.briefText}>{l.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </>
  );
}

/**
 * The decorative art for onboarding page `page` (0..2), laid out in the
 * design's fixed 390x350 box. The parent scales it for narrower screens.
 * Hidden from screen readers.
 */
export function OnboardingArt({ page }: { page: 0 | 1 | 2 }) {
  return (
    <View
      style={styles.box}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {page === 0 ? <Page1 /> : page === 1 ? <Page2 /> : <Page3 />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: ART_W, height: ART_H },
  abs: { position: 'absolute' },
  photo: { overflow: 'hidden', backgroundColor: colors.line },
  fill: { width: '100%', height: '100%' },
  likeChip: {
    position: 'absolute',
    left: 150,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 7,
    paddingRight: 13,
    paddingBottom: 7,
    paddingLeft: 7,
    borderRadius: 999,
    backgroundColor: colors.bg,
    boxShadow: shadow.chip,
  },
  likeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  photosTile: {
    position: 'absolute',
    left: 222,
    top: 258,
    width: 134,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photosText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onAccent,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefCard: {
    width: 278,
    padding: 16,
    borderRadius: 26,
    backgroundColor: colors.bg,
    boxShadow: shadow.obCard,
  },
  briefHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  briefBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  briefMeta: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.muted },
  briefLines: { gap: 10 },
  briefLine: { flexDirection: 'row', gap: 8 },
  briefText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17.55,
    color: colors.inkSoft,
  },
});
