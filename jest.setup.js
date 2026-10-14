/* global jest */
// Native modules have no JS fallback under Jest; stub what the app touches.
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_auth, cb) => {
    cb(null);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ type: 'cancelled', data: null })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
    NULL_PRESENTER: 'NULL_PRESENTER',
  },
  isErrorWithCode: jest.fn(
    e => !!e && typeof e === 'object' && typeof e.code === 'string',
  ),
}));

// Firestore (modular API). Queries/refs are inert objects; listeners never fire.
jest.mock('@react-native-firebase/firestore', () => {
  const ref = path => ({
    id: String(path).split('/').pop(),
    path: String(path),
    parent: null,
  });
  const emptySnap = { docs: [], empty: true, size: 0 };
  const missingDoc = { exists: () => false, data: () => undefined };
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn((_p, ...segs) => ref(segs.join('/'))),
    collectionGroup: jest.fn((_db, id) => ref(id)),
    doc: jest.fn((_p, ...segs) =>
      ref(segs.length ? segs.join('/') : `auto-${Math.random()}`),
    ),
    documentId: jest.fn(() => '__name__'),
    query: jest.fn(q => q),
    where: jest.fn(() => ({})),
    orderBy: jest.fn(() => ({})),
    limit: jest.fn(() => ({})),
    startAfter: jest.fn(() => ({})),
    onSnapshot: jest.fn(() => () => {}),
    getDoc: jest.fn(() => Promise.resolve(missingDoc)),
    getDocs: jest.fn(() => Promise.resolve(emptySnap)),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
    runTransaction: jest.fn((_db, update) =>
      update({
        get: jest.fn(() => Promise.resolve(missingDoc)),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }),
    ),
    increment: jest.fn(n => ({ __increment: n })),
    deleteField: jest.fn(() => ({ __deleteField: true })),
    serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  };
});

jest.mock('@react-native-firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn((_s, path) => ({ fullPath: path })),
  putFile: jest.fn(() => {
    const task = Promise.resolve({ bytesTransferred: 1, totalBytes: 1 });
    task.on = jest.fn(() => () => {});
    task.cancel = jest.fn(() => true);
    return task;
  }),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/x.jpg')),
  deleteObject: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

// The preset's native ImageLoader mock returns undefined; the real
// Image.prefetch resolves with a boolean.
const { Image } = require('react-native');
Image.prefetch = jest.fn(() => Promise.resolve(true));
