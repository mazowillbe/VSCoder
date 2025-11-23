/**
 * Parse terminal output for localhost/127.0.0.1 URLs
 * Extracts port numbers and returns preview URL metadata
 */
export function parsePreviewURLs(text: string) {
  const urls = [];

  // Match patterns like:
  // - http://localhost:3000
  // - http://127.0.0.1:5173
  // - Local:   http://localhost:5173
  const urlPattern =
    /(?:(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?|local[^:]:\s+https?:\/\/(?:localhost|127\.0\.0\.1):\d+)/gi;

  const matches = text.match(urlPattern) || [];

  const portPattern = /:(\d+)/;

  const seen = new Set<number>();

  for (const match of matches) {
    const portMatch = match.match(portPattern);
    if (portMatch && portMatch[1]) {
      const port = parseInt(portMatch[1], 10);

      if (!seen.has(port)) {
        seen.add(port);

        // Normalize the URL
        let displayUrl = match;
        let url = match;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          if (url.includes('local')) {
            // Extract URL from "Local:   http://..." format
            const urlOnly = url.split('http')[1];
            url = 'http' + urlOnly;
          } else {
            url = 'http://' + url;
          }
        }

        // Clean up display URL
        displayUrl = url
          .replace(/https?:\/\//, '')
          .replace(/\/$/, '')
          .substring(0, 50);

        urls.push({
          url,
          displayUrl,
          port,
        });
      }
    }
  }

  return urls;
}

/**
 * Extract port number from a URL string
 */
export function extractPort(urlString: string): number | null {
  const match = urlString.match(/:(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if output contains a dev server URL pattern
 */
export function hasDevServerURL(text: string): boolean {
  return /(?:localhost|127\.0\.0\.1):\d+/.test(text);
}
