# Irča & Ondra — svatební fotky

Mobile-first page where wedding guests upload photos, browse a shared gallery, and the couple
can moderate. Preact + Vite on the front, Firebase (Hosting, Auth, Firestore, Storage, Functions) behind.

## How it works

```
guest phone ──upload──▶ Storage  uploads/<uid>/<id>.jpg
                            │  onPhotoUploaded (Cloud Function)
                            ├─▶ thumbs/<id>.jpg            (800px JPEG)
                            └─▶ Firestore photos/<id>      {who, caption, url, thumbUrl, createdAt}
gallery ◀──live onSnapshot── Firestore photos
admin   ──Google SSO─▶ allowed iff Firestore admins/<email> exists
        ──toggle────▶ Firestore settings/app {uploadsEnabled}   (Storage rules read this)
        ──delete────▶ Firestore photos/<id>  → onPhotoDeleted removes files
        ──ZIP──────▶ downloadAll → exports/<ts>.zip → download URL
```

- Guests are signed in anonymously; they never see a login.
- Storage rules: images only, < 50 MB, only while `uploadsEnabled` is true.
- Photo docs are created only by the function, so clients can't spoof gallery entries.

## One-time setup

1. **Create a Firebase project** at <https://console.firebase.google.com> and upgrade to the
   Blaze plan (required for Storage + Functions; expect a few cents for a wedding).
2. Enable **Authentication → Sign-in method → Anonymous** *and* **Google**.
3. Create **Firestore** (production mode, region `europe-west1` or `eur3`) and **Storage**.
4. In Firestore, create the admin allowlist: collection `admins`, one document per
   admin whose **document ID is the lowercase Google email** (fields can be empty), e.g.
   `admins/ondrej@triggerz.net`.
5. Add a **Web app** in Project settings and copy its config into `.env.production`
   (already filled in for this project; `.env.local` can override locally).
6. Put your project id in `.firebaserc`.
7. Install deps:
   ```sh
   npm install
   npm --prefix functions install
   ```
8. Deploy everything:
   ```sh
   firebase login
   npm run deploy
   ```
   Your site is at `https://<project-id>.web.app` — put that in the QR code.

## Continuous deployment (GitHub Actions)

`.github/workflows/deploy.yml` typechecks and builds on every PR, and deploys hosting, rules
and functions on every push to `main`. One-time setup:

1. Google Cloud console → **IAM & Admin → Service Accounts** → *Create service account*
   (e.g. `github-deploy`). Grant roles: **Firebase Admin**, **Cloud Functions Admin**,
   **Cloud Run Admin**, **Service Account User**, **Cloud Build Editor**,
   **Artifact Registry Administrator**. (Or simply **Editor** + **Service Account User**.)
2. Keys tab → *Add key → JSON*. Download it.
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   named `FIREBASE_SERVICE_ACCOUNT`, paste the whole JSON file as the value.
4. (Optional) Settings → Environments → `production` → add required reviewers if you want a
   manual approval gate before deploys.

The public Firebase web config is committed in `.env.production`; `.env.local` overrides it locally.

## Local development

```sh
# Terminal 1 — emulators (Auth, Firestore, Storage, Functions)
npm --prefix functions run watch   # keeps functions/lib fresh
npm run emulators

# Terminal 2 — Vite dev server, pointed at the emulators
# (set VITE_USE_EMULATORS=true in .env.local)
npm run dev
```

Emulator UI: <http://127.0.0.1:4000>. In the emulator, add your email under `admins` in the
Firestore tab; the Auth emulator lets you sign in with Google using any made-up account.

## Tweaks you may want

- Names/date/copy: `src/screens/Upload.tsx`.
- Colours & fonts: `src/styles.css` (`:root` tokens).
- Thumbnail size / quality: `THUMB_WIDTH` in `functions/src/index.ts`.
- Allow video: change `accept="image/*"` in `Upload.tsx` and `contentType.matches('image/.*')`
  in `storage.rules`; thumbnails will be skipped for videos (gallery shows a placeholder).
- Private gallery until after the wedding: set `allow read: if isAdmin();` on `photos` in
  `firestore.rules`.

## Notes

- iOS converts HEIC → JPEG when picking from the photo library, so thumbnails normally work.
  If a raw HEIC slips through, the photo is still stored; only the thumbnail is skipped.
- Firebase web config in `.env.local` is not secret — rules are the security boundary.
