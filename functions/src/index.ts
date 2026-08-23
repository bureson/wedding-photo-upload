import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";
import archiver from "archiver";
import sharp from "sharp";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { setGlobalOptions } from "firebase-functions/v2";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

/** The photo bucket (europe-west1). Storage triggers must run in the bucket's region. */
const PHOTOS_BUCKET = "wedding-photo-upload-6a020.firebasestorage.app";
const THUMB_WIDTH = 800;
const UPLOADS_PREFIX = "uploads/";

const db = () => getFirestore();
const bucket = () => getStorage().bucket(PHOTOS_BUCKET);

/** Public, tokenised download URL (works without Storage rules granting read). */
function tokenUrl(bucketName: string, path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/**
 * 1. Guest upload lands in uploads/<uid>/<id>.<ext>
 *    → create thumbnail in thumbs/<id>.jpg
 *    → create photos/<id> document for the gallery.
 */
export const onPhotoUploaded = onObjectFinalized(
  // Storage triggers must run in the bucket's region.
  { bucket: PHOTOS_BUCKET, region: "europe-west1", memory: "1GiB", timeoutSeconds: 120 },
  async (event) => {
    const { name: path, contentType, metadata, bucket: bucketName } = event.data;
    if (!path.startsWith(UPLOADS_PREFIX)) return;
    if (!contentType?.startsWith("image/")) {
      logger.warn("Non-image upload, ignoring", { path, contentType });
      return;
    }

    const [, uid, fileName] = path.split("/");
    const id = fileName.replace(/\.[^.]+$/, "");
    const who = (metadata?.who ?? "").slice(0, 60);
    const caption = (metadata?.caption ?? "").slice(0, 200);

    const file = bucket().file(path);

    // Enforce the admin's "uploads paused" switch: discard anything that arrives while paused.
    const settings = await db().doc("settings/app").get();
    if (settings.exists && settings.get("uploadsEnabled") === false) {
      await file.delete({ ignoreNotFound: true });
      logger.info("Uploads paused — discarded", { path });
      return;
    }

    // Ensure the original has a download token so the gallery can link to it.
    let originalToken = metadata?.firebaseStorageDownloadTokens?.split(",")[0];
    if (!originalToken) {
      originalToken = randomUUID();
      await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: originalToken } });
    }

    let thumbUrl: string | null = null;
    try {
      const [buf] = await file.download();
      const thumb = await sharp(buf).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
      const thumbPath = `thumbs/${id}.jpg`;
      const thumbToken = randomUUID();
      await bucket().file(thumbPath).save(thumb, {
        contentType: "image/jpeg",
        metadata: { cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: thumbToken } },
      });
      thumbUrl = tokenUrl(bucketName, thumbPath, thumbToken);
    } catch (err) {
      logger.error("Thumbnail failed (HEIC?), publishing without thumb", { path, err });
    }

    await db().collection("photos").doc(id).set({
      who,
      caption,
      uid,
      path,
      url: tokenUrl(bucketName, path, originalToken),
      thumbUrl,
      createdAt: FieldValue.serverTimestamp(),
    });
    logger.info("Photo published", { id, who });
  },
);

/** 2. Admin deletes the Firestore doc → remove the original and thumbnail. */
export const onPhotoDeleted = onDocumentDeleted("photos/{id}", async (event) => {
  const data = event.data?.data();
  const id = event.params.id;
  const paths = [data?.path as string | undefined, `thumbs/${id}.jpg`].filter(Boolean) as string[];
  await Promise.all(
    paths.map((p) => bucket().file(p).delete({ ignoreNotFound: true })),
  );
  logger.info("Photo files removed", { id });
});

/** Admin = Google-verified email listed in Firestore admins/{email}. */
async function isAdmin(token: { email?: string; email_verified?: boolean } | undefined): Promise<boolean> {
  if (!token?.email || token.email_verified !== true) return false;
  const snap = await db().collection("admins").doc(token.email.toLowerCase()).get();
  return snap.exists;
}

/** 3. Zip every original into exports/<timestamp>.zip and return a download URL. */
export const downloadAll = onCall(
  { memory: "1GiB", timeoutSeconds: 540 },
  async (req) => {
    if (!(await isAdmin(req.auth?.token))) {
      throw new HttpsError("permission-denied", "Admins only");
    }

    const snap = await db().collection("photos").orderBy("createdAt").get();
    if (snap.empty) throw new HttpsError("failed-precondition", "No photos");

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipPath = `exports/svatba-${stamp}.zip`;
    const token = randomUUID();
    const out = bucket().file(zipPath).createWriteStream({
      contentType: "application/zip",
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });

    const archive = archiver("zip", { store: true }); // photos are already compressed
    const pipe = new PassThrough();
    archive.pipe(pipe).pipe(out);

    const finished = new Promise<void>((resolve, reject) => {
      out.on("finish", resolve);
      out.on("error", reject);
      archive.on("error", reject);
    });

    let n = 0;
    for (const doc of snap.docs) {
      const { path, who, createdAt } = doc.data() as { path: string; who: string; createdAt: FirebaseFirestore.Timestamp };
      const ext = path.split(".").pop() ?? "jpg";
      const date = createdAt?.toDate().toISOString().slice(0, 19).replace(/[T:]/g, "-") ?? "";
      const safeWho = (who || "anonym").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 30);
      n++;
      archive.append(bucket().file(path).createReadStream(), { name: `${date}_${safeWho}_${String(n).padStart(4, "0")}.${ext}` });
    }
    await archive.finalize();
    await finished;

    logger.info("Export created", { zipPath, n });
    return { url: tokenUrl(bucket().name, zipPath, token), count: n };
  },
);
