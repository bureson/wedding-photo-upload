import type { Timestamp } from "firebase/firestore";

/** Firestore: photos/{id} — created by the `onPhotoUploaded` Cloud Function. */
export interface PhotoDoc {
  who: string;
  caption: string;
  createdAt: Timestamp;
  /** Storage path of the original, e.g. uploads/<uid>/<id>.jpg */
  path: string;
  /** Public URL of the ~800px thumbnail, null if thumbnailing failed (e.g. HEIC). */
  thumbUrl: string | null;
  /** Public URL of the original. */
  url: string;
  uid: string;
}

export interface Photo extends PhotoDoc {
  id: string;
}

/** Firestore: settings/app */
export interface AppSettings {
  uploadsEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = { uploadsEnabled: true };

/** Alternating tilt for polaroid cards. */
export function rot(i: number): number {
  return [-3, 2, -2, 3, -1, 2][i % 6];
}
