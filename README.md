<p align="center">
  <img src="public/icon-192.png" width="96" alt="App icon">
</p>

<h1 align="center">Irča &amp; Ondra — wedding photos</h1>

<p align="center">
  A page for wedding guests: upload photos from your phone, browse the shared gallery —<br>
  and the newlyweds download everything with one click.
</p>

<p align="center">
  <a href="https://wedding-photo-upload-6a020.web.app"><strong>wedding-photo-upload-6a020.web.app</strong></a>
</p>

---

## Features

| For guests | For the couple |
|---|---|
| 📸 Pick photos from the phone gallery, several at once | 🔐 Google sign-in (allow-listed emails only) |
| ✍️ Optional name and message | ⏸️ Pause uploads with a single switch |
| 📶 Reliable uploads on weak venue wifi (resumable, with progress) | 🗑️ Delete unwanted photos |
| 🖼️ Live shared gallery with thumbnails | 📦 Download all originals as a ZIP |

No sign-up, no login for guests — just a QR code.

🌍 **Czech and English.** The language follows the phone's settings (Czech/Slovak → Czech,
anything else → English). Guests can switch in the footer, and `?lang=en` / `?lang=cs` in the
URL forces a language — handy for a second QR code for international guests.

## How it works

```
guest phone ──upload──▶ Storage  uploads/<uid>/<id>.jpg
                            │  onPhotoUploaded (Cloud Function)
                            ├─▶ thumbs/<id>.jpg            800px thumbnail
                            └─▶ Firestore photos/<id>      {who, caption, url, thumbUrl, createdAt}
gallery ◀──live (onSnapshot)── Firestore photos
admin   ──Google SSO──▶ allowed iff Firestore admins/<email> exists
        ──toggle─────▶ Firestore settings/app {uploadsEnabled}   (enforced by Storage rules)
        ──delete─────▶ Firestore photos/<id> → onPhotoDeleted removes the files
        ──ZIP────────▶ downloadAll → exports/<timestamp>.zip → download link
```

- Guests are signed in **anonymously** (invisible to them; only so security rules can apply).
- Storage rules: images only, max 50 MB, and only while uploads are enabled.
- Photo documents are created exclusively by the Cloud Function — nothing can be spoofed into the gallery from a browser.

## Stack

**Frontend** · [Preact](https://preactjs.com) + [Vite](https://vite.dev) + TypeScript, no router or state library
**Backend** · Firebase — Hosting, Auth (anonymous + Google), Firestore, Storage, Cloud Functions 2nd gen (Node 22)
**Functions** · [sharp](https://sharp.pixelplumbing.com) for thumbnails, [archiver](https://www.archiverjs.com) for the ZIP

```
src/
  App.tsx            screen switching (upload / gallery / login / admin)
  screens/           Upload, Gallery, Login, Admin
  hooks.ts           useAuth, useSettings, useGallery
  i18n.ts            Czech + English strings, device language detection
  upload.ts          resumable uploads to Storage
  Couple.tsx         animated bride & groom in the header
  styles.css         design tokens and styles
functions/src/index.ts   onPhotoUploaded, onPhotoDeleted, downloadAll
firestore.rules · storage.rules
public/            icons, web manifest
```

## Development

```sh
npm install
npm --prefix functions install
npm run dev          # http://localhost:5173 — talks to the live Firebase project
```

The (public) Firebase config lives in `.env.production`; create `.env.local` to override it
locally (template in `.env.example`).

### With emulators

```sh
# terminal 1
npm --prefix functions run watch
npm run emulators                      # UI: http://127.0.0.1:4000

# terminal 2 — set VITE_USE_EMULATORS=true in .env.local
npm run dev
```

In the emulator, add your email to the `admins` collection in Firestore; the Auth emulator lets
you sign in with Google using any made-up account.

## Deployment

### Automatic (GitHub Actions)

- **Pull request** → typecheck, build, temporary preview URL posted as a PR comment.
- **Push to `main`** → typecheck, build, deploy to the live site.

CI deploys **hosting** (the frontend) only. It was set up with `firebase init hosting:github`,
which created the service account and the GitHub secret
`FIREBASE_SERVICE_ACCOUNT_WEDDING_PHOTO_UPLOAD_6A020` automatically.

### Manual (functions and rules)

These change rarely and are deployed by hand:

```sh
firebase login
firebase deploy --only functions,firestore,storage
```

## Administration

### Adding an admin

Firebase console → **Firestore** → collection `admins` → new document with **ID = lowercase email**
(e.g. `ondrej@triggerz.net`). No fields needed. That's it — no redeploy.

### The admin screen

At the bottom of the page, *pro novomanžele* → Google sign-in → **Správa**:
pause uploads, delete a photo, download the ZIP.

The ZIP contains originals named `2026-09-26-21-14-05_Teta_Jana_0001.jpg` (time, name, sequence).
Each download creates a new file under `exports/` in Storage — old ones can be deleted in the console.

## Customising

| What | Where |
|---|---|
| Names | `src/screens/Upload.tsx` |
| Date and all UI text (both languages) | `src/i18n.ts` |
| Colours and fonts | `src/styles.css` (`:root`) |
| Thumbnail size | `THUMB_WIDTH` in `functions/src/index.ts` |
| Allow video | `accept="image/*"` in `Upload.tsx` and `contentType.matches('image/.*')` in `storage.rules` (thumbnails are skipped for video) |
| Gallery visible to admins only | in `firestore.rules`, set `allow read: if isAdmin();` on `photos` |

## Notes

- iOS converts HEIC → JPEG when picking from the photo library, so thumbnails work. If a raw HEIC
  does slip through, the photo is still stored; only the thumbnail is skipped.
- The Firebase web config in the repo **is not a secret** — it identifies the project; the rules are
  the security boundary.
- The default Storage bucket is in `us-west1`, so `onPhotoUploaded` runs there; the other functions
  run in `europe-west1`.
