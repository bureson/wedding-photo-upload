<p align="center">
  <img src="public/icon-192.png" width="96" alt="App icon">
</p>

<h1 align="center">Irča &amp; Ondra — wedding photos</h1>

<p align="center">
  The wedding was on 26 September 2026. The site now shows a thank-you page.
</p>

<p align="center">
  <a href="https://wedding-photo-upload-6a020.web.app"><strong>wedding-photo-upload-6a020.web.app</strong></a>
</p>

---

## What's here

A single static page, `public/index.html` — inline CSS and SVG, no JavaScript, no build step.
It is served by Firebase Hosting so the QR codes printed for the wedding keep working; every
path (and old hash links like `#gallery`) lands on the same page.

```
public/          index.html, icons, web manifest
firebase.json    hosting only
```

## The original app

During the event this was a Preact + Firebase app: guests uploaded photos from their phones,
browsed a live gallery and looked up their bed on the floor plans; the couple could pause
uploads, delete photos and download everything as a ZIP. That version (frontend, Cloud Functions,
Firestore and Storage rules) is preserved under the git tag **`event-final`**:

```sh
git checkout event-final
```

<p align="center">
  <img src="docs/screenshots/mobile/01-upload.png" width="260" alt="Upload screen">
  <img src="docs/screenshots/mobile/03-accommodation.png" width="260" alt="Accommodation overview">
</p>

## Development

Open `public/index.html` in a browser, or serve it the way Hosting does:

```sh
firebase emulators:start --only hosting     # http://localhost:5000
```

## Deployment

- **Pull request** → temporary preview URL posted as a PR comment.
- **Push to `main`** → deploy to the live site.

Both run through GitHub Actions with the `FIREBASE_SERVICE_ACCOUNT_WEDDING_PHOTO_UPLOAD_6A020`
secret. To deploy by hand: `firebase deploy --only hosting`.
