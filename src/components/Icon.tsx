import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';
import { ArrowClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowClockwise';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowLeftIcon } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { ArrowsInLineHorizontalIcon } from 'phosphor-react-native/src/icons/ArrowsInLineHorizontal';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { ImagesIcon } from 'phosphor-react-native/src/icons/Images';
import { ImageIcon } from 'phosphor-react-native/src/icons/Image';
import { ImageSquareIcon } from 'phosphor-react-native/src/icons/ImageSquare';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { NotePencilIcon } from 'phosphor-react-native/src/icons/NotePencil';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { TextAlignLeftIcon } from 'phosphor-react-native/src/icons/TextAlignLeft';
import { ChartBarHorizontalIcon } from 'phosphor-react-native/src/icons/ChartBarHorizontal';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree';
import { DotsThreeVerticalIcon } from 'phosphor-react-native/src/icons/DotsThreeVertical';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { ChatCircleDotsIcon } from 'phosphor-react-native/src/icons/ChatCircleDots';
import { ShareFatIcon } from 'phosphor-react-native/src/icons/ShareFat';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { PaperPlaneTiltIcon } from 'phosphor-react-native/src/icons/PaperPlaneTilt';
import { PaperPlaneRightIcon } from 'phosphor-react-native/src/icons/PaperPlaneRight';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { VideoCameraIcon } from 'phosphor-react-native/src/icons/VideoCamera';
import { StarIcon } from 'phosphor-react-native/src/icons/Star';
import { GlobeHemisphereWestIcon } from 'phosphor-react-native/src/icons/GlobeHemisphereWest';
import { GoogleLogoIcon } from 'phosphor-react-native/src/icons/GoogleLogo';
import { AppleLogoIcon } from 'phosphor-react-native/src/icons/AppleLogo';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { CakeIcon } from 'phosphor-react-native/src/icons/Cake';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { BriefcaseIcon } from 'phosphor-react-native/src/icons/Briefcase';
import { HouseLineIcon } from 'phosphor-react-native/src/icons/HouseLine';
import { GraduationCapIcon } from 'phosphor-react-native/src/icons/GraduationCap';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { BookmarkSimpleIcon } from 'phosphor-react-native/src/icons/BookmarkSimple';
import { CirclesThreePlusIcon } from 'phosphor-react-native/src/icons/CirclesThreePlus';
import { ClockCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ClockCounterClockwise';
import { RowsIcon } from 'phosphor-react-native/src/icons/Rows';
import { ProhibitIcon } from 'phosphor-react-native/src/icons/Prohibit';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { AtIcon } from 'phosphor-react-native/src/icons/At';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { QuestionIcon } from 'phosphor-react-native/src/icons/Question';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { AnchorIcon } from 'phosphor-react-native/src/icons/Anchor';
import { SquaresFourIcon } from 'phosphor-react-native/src/icons/SquaresFour';
import { colors } from '../theme';

/**
 * Phosphor icons (phosphor-react-native v3), imported per icon because
 * Metro does not tree-shake the barrel. Names are the Phosphor kebab names
 * used in the design (`ph ph-NAME` = weight "regular", `ph-fill ph-NAME` =
 * weight "fill"). `size` is the design's CSS font-size.
 *
 *   <Icon name="heart" weight="fill" size={20} color={colors.accent} />
 *
 * Need a name that is missing? Ask the foundation owner (A) to add it here.
 */
const ICONS = {
  house: HouseIcon,
  compass: CompassIcon,
  sparkle: SparkleIcon,
  'caret-left': CaretLeftIcon,
  'caret-right': CaretRightIcon,
  'caret-down': CaretDownIcon,
  'caret-up': CaretUpIcon,
  'arrow-clockwise': ArrowClockwiseIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-counter-clockwise': ArrowCounterClockwiseIcon,
  'arrows-in-line-horizontal': ArrowsInLineHorizontalIcon,
  x: XIcon,
  'warning-circle': WarningCircleIcon,
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  check: CheckIcon,
  'check-circle': CheckCircleIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  images: ImagesIcon,
  image: ImageIcon,
  'image-square': ImageSquareIcon,
  camera: CameraIcon,
  plus: PlusIcon,
  'note-pencil': NotePencilIcon,
  'pencil-simple': PencilSimpleIcon,
  'text-align-left': TextAlignLeftIcon,
  'chart-bar-horizontal': ChartBarHorizontalIcon,
  sun: SunIcon,
  users: UsersIcon,
  'users-three': UsersThreeIcon,
  user: UserIcon,
  'user-plus': UserPlusIcon,
  'dots-three': DotsThreeIcon,
  'dots-three-vertical': DotsThreeVerticalIcon,
  'chat-circle': ChatCircleIcon,
  'chat-circle-dots': ChatCircleDotsIcon,
  'share-fat': ShareFatIcon,
  'share-network': ShareNetworkIcon,
  heart: HeartIcon,
  bell: BellIcon,
  'paper-plane-tilt': PaperPlaneTiltIcon,
  'paper-plane-right': PaperPlaneRightIcon,
  phone: PhoneIcon,
  'video-camera': VideoCameraIcon,
  star: StarIcon,
  'globe-hemisphere-west': GlobeHemisphereWestIcon,
  'google-logo': GoogleLogoIcon,
  'apple-logo': AppleLogoIcon,
  'map-pin': MapPinIcon,
  cake: CakeIcon,
  'clipboard-text': ClipboardTextIcon,
  'gear-six': GearSixIcon,
  briefcase: BriefcaseIcon,
  'house-line': HouseLineIcon,
  'graduation-cap': GraduationCapIcon,
  'calendar-blank': CalendarBlankIcon,
  'bookmark-simple': BookmarkSimpleIcon,
  'circles-three-plus': CirclesThreePlusIcon,
  'clock-counter-clockwise': ClockCounterClockwiseIcon,
  rows: RowsIcon,
  prohibit: ProhibitIcon,
  'download-simple': DownloadSimpleIcon,
  at: AtIcon,
  'sign-out': SignOutIcon,
  lock: LockIcon,
  question: QuestionIcon,
  trash: TrashIcon,
  anchor: AnchorIcon,
  'squares-four': SquaresFourIcon,
} satisfies Record<string, PhosphorIcon>;

export type PhosphorName = keyof typeof ICONS;

/** Every icon name is a Phosphor name. */
export type IconName = PhosphorName;

export type IconWeight = 'regular' | 'fill' | 'bold';

type Props = {
  name: IconName;
  /** "regular" (default) or "fill"; "bold" only for the create-story plus. */
  weight?: IconWeight;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export const Icon = React.memo(function PhosphorIconView({
  name,
  weight = 'regular',
  size = 24,
  color = colors.ink,
  style,
}: Props) {
  const Component = ICONS[name];
  return <Component size={size} color={color} weight={weight} style={style} />;
});
