// ============================================================
// 🎛️  CONFIGURATION — plug your Spotify app credentials here
// ============================================================

export const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID, // From developer.spotify.com
  REDIRECT_URI: window.location.origin + window.location.pathname, // auto-detected
  SCOPES: [
    "user-top-read",
    "user-read-recently-played",
    "user-read-playback-state",
    "user-read-private",
    "user-library-read",
  ].join(" "),
};
