// Deps
import { useState, useEffect, useCallback } from "react";

// Auth
import { initiateLogin, exchangeCodeForToken } from "../helpers/spotifyOAuth";

// Config
import { SPOTIFY_CONFIG } from "../config/spotifyConfig";

// Spotify calls
import { spotifyFetch } from "../api/spotifyCall";

// Utils
import { timeAgo } from "../utils/time";

// ─── Main App ─────────────────────────────────────────────────
export default function SillySpotify() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("ss_token") || "",
  );
  const [user, setUser] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [timeRange, setTimeRange] = useState("medium_term");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConfigured = SPOTIFY_CONFIG.CLIENT_ID !== "YOUR_CLIENT_ID_HERE";

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !token) {
      setLoading(true);
      exchangeCodeForToken(code)
        .then((data) => {
          if (data.access_token) {
            sessionStorage.setItem("ss_token", data.access_token);
            setToken(data.access_token);
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            setError(
              "Token exchange failed. Check your Client ID and Redirect URI.",
            );
          }
        })
        .catch(() => setError("OAuth error — see console."))
        .finally(() => setLoading(false));
    }
  }, []);

  // Load data when token available
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [me, tracks, artists, recentPlays] = await Promise.all([
        spotifyFetch("/me", token),
        spotifyFetch(`/me/top/tracks?limit=20&time_range=${timeRange}`, token),
        spotifyFetch(`/me/top/artists?limit=24&time_range=${timeRange}`, token),
        spotifyFetch("/me/player/recently-played?limit=15", token),
      ]);
      setUser(me);
      setTopTracks(tracks.items || []);
      setTopArtists(artists.items || []);
      setRecent(recentPlays.items || []);
    } catch (e) {
      setError(e.message);
      if (e.message.includes("401")) {
        sessionStorage.removeItem("ss_token");
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute genre frequencies from top artists
  const genres = (() => {
    const freq = {};
    topArtists.forEach((a) =>
      a.genres?.forEach((g) => {
        freq[g] = (freq[g] || 0) + 1;
      }),
    );
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  })();
  const maxGenre = genres[0]?.[1] || 1;

  const avgPop = topTracks.length
    ? Math.round(
        topTracks.reduce((s, t) => s + t.popularity, 0) / topTracks.length,
      )
    : 0;

  function logout() {
    sessionStorage.removeItem("ss_token");
    setToken("");
    setUser(null);
    setTopTracks([]);
    setTopArtists([]);
    setRecent([]);
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <div className="aurora" />
      <div className="app">
        {/* Loading state */}
        {loading && (
          <div className="loading-screen">
            <div className="spinner" />
            <div className="loading-text">Connecting to Spotify…</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="loading-screen">
            <div
              style={{
                color: "var(--pink)",
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                maxWidth: 400,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              ⚠️ {error}
            </div>
            <button
              className="btn-login"
              style={{ background: "var(--pink)" }}
              onClick={() => {
                setError("");
                setToken("");
              }}
            >
              Back to Start
            </button>
          </div>
        )}

        {/* Welcome page */}
        {!token && !loading && !error && (
          <div className="welcome">
            <div className="logo-mark">🎵</div>
            <div>
              <h1>
                Silly<span>Spotify</span>
              </h1>
              <p style={{ marginTop: "0.75rem" }}>
                Your listening habits, visualised. See your top tracks, artists,
                and hidden genre obsessions.
              </p>
            </div>

            {!isConfigured ? (
              <div className="config-notice">
                <strong>⚙️ Setup required</strong> — Open{" "}
                <code>SillySpotify.jsx</code> and replace{" "}
                <code>YOUR_CLIENT_ID_HERE</code> with your app's Client ID from{" "}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--pink)" }}
                >
                  developer.spotify.com
                </a>
                . Set the Redirect URI there to:{" "}
                <code>{window.location.origin + window.location.pathname}</code>
              </div>
            ) : (
              <button className="btn-login" onClick={initiateLogin}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Connect with Spotify
              </button>
            )}

            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--muted)",
                maxWidth: 340,
                lineHeight: 1.5,
              }}
            >
              Uses the official Spotify Web API. No data leaves your browser —
              everything stays client-side.
            </p>
          </div>
        )}

        {/* Dashboard */}
        {token && !loading && !error && user && (
          <div className="dashboard">
            {/* Top bar */}
            <div className="topbar">
              <h2>
                <em>Silly</em>Spotify &nbsp;
                <span
                  style={{
                    color: "var(--muted)",
                    fontWeight: 400,
                    fontSize: "1rem",
                  }}
                >
                  — your wrapped, any day
                </span>
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div className="avatar-btn">
                  {user.images?.[0]?.url ? (
                    <img
                      className="avatar"
                      src={user.images[0].url}
                      alt={user.display_name}
                    />
                  ) : (
                    <div
                      className="avatar"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                      }}
                    >
                      🎧
                    </div>
                  )}
                  <span className="avatar-name">{user.display_name}</span>
                </div>
                <button className="logout-btn" onClick={logout}>
                  Sign out
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="stat-row">
              {[
                {
                  label: "Top Tracks",
                  value: topTracks.length,
                  sub: "in your library",
                },
                {
                  label: "Top Artists",
                  value: topArtists.length,
                  sub: "tracked",
                },
                { label: "Avg Popularity", value: avgPop, sub: "out of 100" },
                {
                  label: "Genres Found",
                  value: genres.length,
                  sub: "across top artists",
                },
                {
                  label: "Recent Plays",
                  value: recent.length,
                  sub: "last sessions",
                },
              ].map((s) => (
                <div className="stat-card" key={s.label}>
                  <div className="label">{s.label}</div>
                  <div className="value">{s.value}</div>
                  <div className="sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Time range tabs (shared) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                Showing:
              </span>
              {[
                { key: "short_term", label: "4 weeks" },
                { key: "medium_term", label: "6 months" },
                { key: "long_term", label: "All time" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`tab ${timeRange === t.key ? "active" : ""}`}
                  onClick={() => setTimeRange(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Top Tracks */}
            <div className="section panel">
              <div className="section-head">
                <div className="dot" />
                Top Tracks
              </div>
              <div className="track-list">
                {topTracks.slice(0, 10).map((t, i) => (
                  <div className="track-item" key={t.id}>
                    <span className="track-num">{i + 1}</span>
                    <img
                      className="track-art"
                      src={
                        t.album?.images?.[2]?.url || t.album?.images?.[0]?.url
                      }
                      alt=""
                    />
                    <div className="track-info">
                      <div className="track-name">{t.name}</div>
                      <div className="track-artist">
                        {t.artists?.map((a) => a.name).join(", ")}
                      </div>
                    </div>
                    <div className="track-pop">
                      <div
                        className="pop-bar"
                        style={{ width: `${t.popularity}%`, maxWidth: 60 }}
                      />
                      <span className="pop-label">{t.popularity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: "1.5rem" }} />

            {/* Two-col: Artists + Genres */}
            <div className="two-col">
              {/* Top Artists */}
              <div className="panel">
                <div className="section-head">
                  <div
                    className="dot"
                    style={{ background: "var(--violet)" }}
                  />
                  Top Artists
                </div>
                <div className="artist-grid">
                  {topArtists.slice(0, 12).map((a, i) => (
                    <div className="artist-card" key={a.id}>
                      <div className="artist-rank">#{i + 1}</div>
                      <img
                        className="artist-img"
                        src={a.images?.[2]?.url || a.images?.[0]?.url}
                        alt={a.name}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="artist-name">{a.name}</div>
                      <div className="artist-genres">
                        {a.genres?.[0] || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genre breakdown */}
              <div className="panel">
                <div className="section-head">
                  <div className="dot" style={{ background: "var(--pink)" }} />
                  Genre DNA
                </div>
                <div className="genre-list">
                  {genres.map(([name, count]) => (
                    <div className="genre-row" key={name}>
                      <span className="genre-name">{name}</span>
                      <div className="genre-track">
                        <div
                          className="genre-fill"
                          style={{ width: `${(count / maxGenre) * 100}%` }}
                        />
                      </div>
                      <span className="genre-count">{count}</span>
                    </div>
                  ))}
                  {genres.length === 0 && (
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      No genre data yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recently Played */}
            <div className="section panel">
              <div className="section-head">
                <div className="dot" style={{ background: "var(--pink)" }} />
                Recently Played
              </div>
              <div className="recent-list">
                {recent.map((item, i) => (
                  <div className="recent-item" key={`${item.track?.id}-${i}`}>
                    <img
                      className="recent-art"
                      src={
                        item.track?.album?.images?.[2]?.url ||
                        item.track?.album?.images?.[0]?.url
                      }
                      alt=""
                    />
                    <div className="recent-info">
                      <div className="recent-name">{item.track?.name}</div>
                      <div className="recent-artist">
                        {item.track?.artists?.map((a) => a.name).join(", ")}
                      </div>
                    </div>
                    <span className="recent-time">
                      {timeAgo(item.played_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: "3rem" }} />
          </div>
        )}
      </div>
    </>
  );
}
