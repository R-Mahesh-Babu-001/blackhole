/**
 * Utility functions for citation parsing and hostname extraction
 */

/**
 * Extracts a clean hostname from a given URL string
 * @param {string} url 
 * @returns {string}
 */
export function extractHostname(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}
