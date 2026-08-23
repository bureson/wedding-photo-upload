import { useEffect, useState } from "preact/hooks";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { DEFAULT_SETTINGS, type AppSettings, type Photo, type PhotoDoc } from "./types";

export type LoginResult = "ok" | "not-admin" | "cancelled" | "error";

/** Is this user's (verified) email allow-listed in Firestore admins/{email}? */
async function isAdminUser(u: User): Promise<boolean> {
  if (u.isAnonymous || !u.email || !u.emailVerified) return false;
  try {
    const snap = await getDoc(doc(db, "admins", u.email.toLowerCase()));
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Keeps every visitor signed in anonymously. Admins sign in with Google;
 * admin status = their email is listed in Firestore `admins/{email}`.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setAdmin(false);
        await signInAnonymously(auth).catch(console.error);
        return;
      }
      setUser(u);
      setAdmin(await isAdminUser(u));
    });
  }, []);

  async function loginAdmin(): Promise<LoginResult> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const { user: u } = await signInWithPopup(auth, provider);
      if (await isAdminUser(u)) return "ok";
      await signOut(auth); // not on the list → back to anonymous
      return "not-admin";
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("popup-closed") || code.includes("cancelled")) return "cancelled";
      console.error(err);
      return "error";
    }
  }

  async function logoutAdmin() {
    await signOut(auth); // onAuthStateChanged re-signs anonymously
  }

  return { user, admin, loginAdmin, logoutAdmin };
}

/** `null` until the first snapshot arrives, so the UI never flashes the wrong state. */
export function useSettings(): AppSettings | null {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  useEffect(() => {
    return onSnapshot(
      doc(db, "settings", "app"),
      (snap) => setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<AppSettings>) }),
      (err) => {
        console.error(err);
        setSettings(DEFAULT_SETTINGS); // don't block guests if the read fails
      },
    );
  }, []);
  return settings;
}

/** Live list of photos, newest first. Only subscribes while `active`. */
export function useGallery(active: boolean): Photo[] {
  const [photos, setPhotos] = useState<Photo[]>([]);
  useEffect(() => {
    if (!active) return;
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => setPhotos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PhotoDoc) }))),
      console.error,
    );
  }, [active]);
  return photos;
}
