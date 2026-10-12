/**
 * BlackHole Backend API Service Configuration
 * Resolves the backend base URL dynamically across local dev, Render static site,
 * and unified backend-hosted deployments.
 */

export const getBackendBaseUrl = () => {
  // 1. Prioritize explicitly injected Vite environment variables
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "");
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }

  // 2. Check window environment
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;

    // If served by the backend directly on the same domain
    if (hostname === "blackhole-foku.onrender.com") {
      return origin;
    }

    // Local development environment
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  // 3. Default to the live Render backend Web Service
  return "https://blackhole-foku.onrender.com";
};

