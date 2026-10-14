import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import type { LocalImage } from '../state/storeTypes';

/**
 * Thin wrapper around react-native-image-picker. Resolves with a LocalImage,
 * null when the user cancels, and rejects with an Error whose message is safe
 * to show in the UI.
 */

const COMMON = {
  mediaType: 'photo' as const,
  // The picker only accepts tenths; 0.8 keeps uploads small with no visible loss.
  quality: 0.8 as const,
  maxWidth: 2048,
  maxHeight: 2048,
};

function toLocalImage(asset: Asset | undefined): LocalImage {
  if (!asset?.uri) {
    throw new Error('That photo could not be opened. Try a different one.');
  }
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.type,
    fileName: asset.fileName,
  };
}

function settle(
  res: ImagePickerResponse,
  source: 'library' | 'camera',
): LocalImage | null {
  if (res.didCancel) {
    return null;
  }
  if (res.errorCode) {
    switch (res.errorCode) {
      case 'permission':
        throw new Error(
          source === 'camera'
            ? 'Harbor needs camera access. You can turn it on in Settings.'
            : 'Harbor needs access to your photos. You can turn it on in Settings.',
        );
      case 'camera_unavailable':
        throw new Error('The camera is not available on this device.');
      default:
        throw new Error('Something went wrong opening your photos.');
    }
  }
  return toLocalImage(res.assets?.[0]);
}

/** Pick one photo from the library. */
export async function pickImage(): Promise<LocalImage | null> {
  let res: ImagePickerResponse;
  try {
    res = await launchImageLibrary({ ...COMMON, selectionLimit: 1 });
  } catch {
    throw new Error('Something went wrong opening your photos.');
  }
  return settle(res, 'library');
}

async function ensureCameraPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error(
      'Harbor needs camera access. You can turn it on in Settings.',
    );
  }
}

/** Take a new photo with the camera. */
export async function takePhoto(): Promise<LocalImage | null> {
  await ensureCameraPermission();
  let res: ImagePickerResponse;
  try {
    res = await launchCamera({ ...COMMON, saveToPhotos: false });
  } catch {
    throw new Error('The camera could not be opened.');
  }
  return settle(res, 'camera');
}

/** Width / height of a picked image, or undefined when unknown. */
export function aspectOf(image: LocalImage): number | undefined {
  if (image.width && image.height) {
    return image.width / image.height;
  }
  return undefined;
}
