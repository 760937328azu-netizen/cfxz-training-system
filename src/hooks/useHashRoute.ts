import { useEffect, useMemo, useState } from "react";

export type AppRoute =
  | { name: "home" }
  | { name: "tasks" }
  | { name: "certification" }
  | { name: "learning-world" }
  | { name: "history" }
  | { name: "profile" }
  | { name: "stage"; stageId: string }
  | { name: "admin"; page: AdminPage };

export type AdminPage =
  | "login"
  | "dashboard"
  | "employees"
  | "batches"
  | "progress"
  | "certification"
  | "history"
  | "reports"
  | "settings";

function parseHash(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, "");

  // ── Admin routes ──
  if (hash === "admin" || hash === "admin/login" || hash === "admin/")
    return { name: "admin", page: "login" };
  if (hash.startsWith("admin/")) {
    const page = hash.slice("admin/".length) as AdminPage;
    const validPages: AdminPage[] = [
      "login", "dashboard", "employees", "batches", "progress",
      "certification", "history", "reports", "settings",
    ];
    if (validPages.includes(page)) return { name: "admin", page };
    return { name: "admin", page: "login" };
  }

  if (!hash || hash === "home" || hash === "map") return { name: "home" };
  if (hash.startsWith("stage/")) return { name: "stage", stageId: hash.slice("stage/".length) };
  if (hash === "tasks") return { name: "tasks" };
  if (hash === "certification") return { name: "certification" };
  if (hash === "learning-world") return { name: "learning-world" };
  if (hash === "history") return { name: "history" };
  if (hash === "profile") return { name: "profile" };
  return { name: "home" };
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseHash());

  useEffect(() => {
    // Disable browser-native scroll restoration so hash changes never inherit
    // scroll position from the previous or future history entry.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return useMemo(
    () => ({
      route,
      navigate: (path: string) => {
        window.location.hash = path.startsWith("/") ? path : `/${path}`;
      },
    }),
    [route],
  );
}
