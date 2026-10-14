import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = {
  /** Rendered at 30 (onboarding), 32 (feed header pill) and 56 (auth). */
  size?: number;
};

/** The Harbor mark, verbatim from SPEC Appendix A (viewBox 0 0 64 64). */
export function Logo({ size = 32 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityLabel="Harbor"
    >
      <Rect width={64} height={64} rx={18} fill="#2F5BD3" />
      <Path
        d="M20 10h24a7 7 0 0 1 7 7v9a7 7 0 0 1-7 7H35l-3 5-3-5H20a7 7 0 0 1-7-7v-9a7 7 0 0 1 7-7z"
        fill="#FFFFFF"
      />
      <Circle cx={25.5} cy={21.5} r={2.4} fill="#2F5BD3" />
      <Circle cx={32} cy={21.5} r={2.4} fill="#2F5BD3" />
      <Circle cx={38.5} cy={21.5} r={2.4} fill="#2F5BD3" />
      <Path
        d="M32 37v17"
        stroke="#FFFFFF"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <Path
        d="M15 42c0 8 7.5 13 17 13s17-5 17-13"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <Path
        d="M15 42l-4 3.5M15 42l5 3M49 42l4 3.5M49 42l-5 3"
        stroke="#FFFFFF"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Alias matching SPEC section 5's name. */
export const HarborLogo = Logo;
