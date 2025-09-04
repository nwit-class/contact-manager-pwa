const PAGES = "https://contact-manager-pwa-ab6.pages.dev";
export const API =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? `${PAGES}/api`
    : "/api";