import { useEffect, useState } from "preact/hooks";

/**
 * Minimal hash routing: the screen lives in `location.hash` (`#gallery`,
 * `#accommodation/krbovy`, `#admin`; empty = upload). This keeps the browser
 * back button working and makes every screen linkable (e.g. from a QR code).
 * `?lang=` in the query string is untouched.
 */

const listeners = new Set<() => void>();

function current(): string {
  try {
    return decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  } catch {
    return "";
  }
}

export function navigate(path: string) {
  if (path === current()) return;
  history.pushState(null, "", location.pathname + location.search + (path ? `#${path}` : ""));
  window.scrollTo(0, 0);
  listeners.forEach((fn) => fn());
}

window.addEventListener("popstate", () => listeners.forEach((fn) => fn()));

/** Current route (hash without `#`), re-rendering the component when it changes. */
export function useRoute(): string {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return current();
}
