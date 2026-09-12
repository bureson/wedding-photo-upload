import { useAuth, useGallery, useSettings } from "./hooks";
import { navigate, useRoute } from "./router";
import { DEFAULT_SETTINGS } from "./types";
import { UploadScreen } from "./screens/Upload";
import { GalleryScreen } from "./screens/Gallery";
import { LoginScreen } from "./screens/Login";
import { AdminScreen } from "./screens/Admin";
import { AccommodationScreen } from "./screens/Accommodation";

/**
 * Screens are addressed by the URL hash (see router.ts):
 *   (none)                    upload — the default
 *   #gallery                  shared gallery
 *   #accommodation[/<apt>]    where we sleep — overview or one apartment
 *   #admin                    admin (shows the login first if not signed in)
 */
export function App() {
  const route = useRoute();
  const [head, sub] = route.split("/");
  const view = head === "gallery" || head === "accommodation" || head === "admin" ? head : "upload";

  const { admin, loginAdmin, logoutAdmin } = useAuth();
  const settings = useSettings();
  const photos = useGallery(view === "gallery" || view === "admin");

  const goUpload = () => navigate("");

  return (
    <div class="shell">
      <div class="page">
        {view === "upload" && (
          <UploadScreen
            uploadsEnabled={settings ? settings.uploadsEnabled : null}
            onGallery={() => navigate("gallery")}
            onAccommodation={() => navigate("accommodation")}
            onAdmin={() => navigate("admin")}
          />
        )}
        {view === "gallery" && <GalleryScreen photos={photos} onBack={goUpload} />}
        {view === "accommodation" && (
          <AccommodationScreen
            aptId={sub || null}
            onOpen={(id) => navigate(`accommodation/${id}`)}
            onOverview={() => navigate("accommodation")}
            onBack={goUpload}
          />
        )}
        {view === "admin" && (admin ? (
          <AdminScreen
            photos={photos}
            settings={settings ?? DEFAULT_SETTINGS}
            onBack={goUpload}
            onLogout={async () => { await logoutAdmin(); goUpload(); }}
          />
        ) : (
          <LoginScreen onLogin={loginAdmin} onSuccess={() => navigate("admin")} onBack={goUpload} />
        ))}
      </div>
    </div>
  );
}
