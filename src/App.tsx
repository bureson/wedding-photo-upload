import { useState } from "preact/hooks";
import { useAuth, useGallery, useSettings } from "./hooks";
import { DEFAULT_SETTINGS } from "./types";
import { UploadScreen } from "./screens/Upload";
import { GalleryScreen } from "./screens/Gallery";
import { LoginScreen } from "./screens/Login";
import { AdminScreen } from "./screens/Admin";

type View = "upload" | "gallery" | "login" | "admin";

export function App() {
  const [view, setView] = useState<View>("upload");
  const { admin, loginAdmin, logoutAdmin } = useAuth();
  const settings = useSettings();
  const photos = useGallery(view === "gallery" || view === "admin");

  const goUpload = () => setView("upload");

  return (
    <div class="shell">
      <div class="page">
        {view === "upload" && (
          <UploadScreen
            uploadsEnabled={settings ? settings.uploadsEnabled : null}
            onGallery={() => setView("gallery")}
            onAdmin={() => setView(admin ? "admin" : "login")}
          />
        )}
        {view === "gallery" && <GalleryScreen photos={photos} onBack={goUpload} />}
        {view === "login" && (
          <LoginScreen onLogin={loginAdmin} onSuccess={() => setView("admin")} onBack={goUpload} />
        )}
        {view === "admin" && (admin ? (
          <AdminScreen
            photos={photos}
            settings={settings ?? DEFAULT_SETTINGS}
            onBack={goUpload}
            onLogout={async () => { await logoutAdmin(); goUpload(); }}
          />
        ) : (
          <LoginScreen onLogin={loginAdmin} onSuccess={() => setView("admin")} onBack={goUpload} />
        ))}
      </div>
    </div>
  );
}
