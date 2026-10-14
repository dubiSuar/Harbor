import { DEMO_MODE } from '../../config';
import { createDemoBackend } from './demo';
import { createFirebaseBackend } from './firebase';
import type { Backend } from './types';

export * from './types';

/**
 * Creates the data backend for a signed-in user: the offline demo adapter
 * when DEMO_MODE is on, Firestore + Storage otherwise. Create one per
 * session; StoreProvider makes a new one whenever the signed-in user changes.
 */
export function createBackend(meId: string): Backend {
  return DEMO_MODE ? createDemoBackend() : createFirebaseBackend(meId);
}
