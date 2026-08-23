import { ref, uploadBytesResumable } from "firebase/storage";
import { auth, storage } from "./firebase";

export interface PendingPhoto {
  file: File;
  /** Object URL for preview; revoke when removed. */
  src: string;
}

export interface UploadProgress {
  done: number;
  total: number;
}

function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split("/")[1] ?? "jpg";
}

/**
 * Uploads each file to uploads/<uid>/<id>.<ext>. The Cloud Function
 * `onPhotoUploaded` then creates the thumbnail and Firestore document.
 * Uploads run 2 at a time and retry on failure (resumable).
 */
export async function uploadPhotos(
  photos: PendingPhoto[],
  meta: { who: string; caption: string },
  onProgress: (p: UploadProgress) => void,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not signed in");

  let done = 0;
  const total = photos.length;
  onProgress({ done, total });

  const queue = [...photos];
  async function worker() {
    while (queue.length) {
      const p = queue.shift()!;
      await uploadOne(p, uid!, meta);
      done++;
      onProgress({ done, total });
    }
  }
  await Promise.all([worker(), worker()]);
}

function uploadOne(p: PendingPhoto, uid: string, meta: { who: string; caption: string }) {
  const path = `uploads/${uid}/${newId()}.${extensionFor(p.file)}`;
  const task = uploadBytesResumable(ref(storage, path), p.file, {
    contentType: p.file.type || "image/jpeg",
    customMetadata: { who: meta.who.slice(0, 60), caption: meta.caption.slice(0, 200) },
  });
  return new Promise<void>((resolve, reject) => {
    task.on("state_changed", undefined, reject, () => resolve());
  });
}
