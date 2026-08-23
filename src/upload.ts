import { ref, uploadBytesResumable } from "firebase/storage";
import { auth, storage } from "./firebase";

export interface PendingPhoto {
  file: File;
  /** Object URL for preview; revoke when removed. */
  src: string;
}

export interface UploadProgress {
  /** Files finished. */
  done: number;
  total: number;
  /** 0..1 across all bytes (after resizing), for a smooth progress bar. */
  fraction: number;
}

const PARALLEL = 3;
/** Longest edge after resizing. 2048px is plenty for screens and 20×30 cm prints. */
const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.85;

function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Downscale to MAX_EDGE and re-encode as JPEG. Cuts a typical 4–8 MB phone photo to ~1 MB,
 * which is the single biggest upload speed-up. Orientation is applied from EXIF.
 * Falls back to the original file if the browser can't decode it (e.g. raw HEIC on non-Safari).
 */
async function prepare(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("toBlob failed");
    // If re-encoding didn't help (tiny image), keep the original bytes.
    return blob.size < file.size ? blob : file;
  } catch (err) {
    console.warn("Resize failed, uploading original", err);
    return file;
  }
}

/**
 * Uploads each photo to uploads/<uid>/<id>.jpg. The Cloud Function `onPhotoUploaded`
 * then creates the thumbnail and Firestore document. Runs PARALLEL uploads at a time,
 * resumable (survives flaky wifi), with byte-level progress.
 */
export async function uploadPhotos(
  photos: PendingPhoto[],
  meta: { who: string; caption: string },
  onProgress: (p: UploadProgress) => void,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not signed in");

  const total = photos.length;
  let done = 0;
  const sent = new Map<PendingPhoto, number>();
  const sizes = new Map<PendingPhoto, number>();
  const report = () => {
    const bytesTotal = [...sizes.values()].reduce((a, b) => a + b, 0);
    const bytesSent = [...sent.values()].reduce((a, b) => a + b, 0);
    // Until sizes are known, estimate from file count.
    const fraction = bytesTotal ? bytesSent / bytesTotal : done / total;
    onProgress({ done, total, fraction });
  };
  report();

  const queue = [...photos];
  async function worker() {
    while (queue.length) {
      const p = queue.shift()!;
      const blob = await prepare(p.file);
      sizes.set(p, blob.size);
      await uploadOne(blob, uid!, meta, (bytes) => {
        sent.set(p, bytes);
        report();
      });
      sent.set(p, blob.size);
      done++;
      report();
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL, total) }, worker));
}

function uploadOne(blob: Blob, uid: string, meta: { who: string; caption: string }, onBytes: (n: number) => void) {
  // Resized photos are JPEG; the fallback keeps the original type (e.g. image/png, image/heic).
  const contentType = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `uploads/${uid}/${newId()}.${ext}`;
  const task = uploadBytesResumable(ref(storage, path), blob, {
    contentType,
    customMetadata: { who: meta.who.slice(0, 60), caption: meta.caption.slice(0, 200) },
  });
  return new Promise<void>((resolve, reject) => {
    task.on("state_changed", (snap) => onBytes(snap.bytesTransferred), reject, () => resolve());
  });
}
