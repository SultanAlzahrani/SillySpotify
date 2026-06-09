# SillySpotify

A frontend-only React dashboard that pulls your Spotify listening analytics and displays them in a stylish, aurora-themed UI. No backend, no server, everything runs in the browser using Spotify's official Web API with PKCE OAuth. Check it out Live at [SillySpotify](https://sillyspotify.sultanonline.app/).

---

## What It Shows

- **Top Tracks** — your most-played songs with popularity scores
- **Top Artists** — grid of your most-listened artists with genre tags
- **Genre DNA** — bar chart derived from your top artists' genre data
- **Recently Played** — last 15 tracks with relative timestamps
- **Stat Cards** — quick-glance numbers across all categories
- **Time Range Toggle** — switch between 4 weeks, 6 months, and all time

---

## Setup

### 1. Create a Spotify App

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in and click **Create App**
3. Give it any name and description
4. Under **Redirect URIs**, add the exact URL where you'll run the app — for local dev that's usually `http://localhost:5173/`
5. Save, then copy your **Client ID** from the app dashboard

### 2. Plug In Your Client ID

Open `SillySpotify.jsx` and find this block near the top of the file:

```js
const SPOTIFY_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID_HERE",
  ...
};
```

Replace `YOUR_CLIENT_ID_HERE` with your Client ID. The redirect URI auto-detects from the browser — no changes needed there.

### 3. Run It

Drop the file into any React project. If you need a fresh one:

```bash
npm create vite@latest silly-spotify -- --template react
cd silly-spotify
npm install
```

Replace the contents of `src/App.jsx` with `SillySpotify.jsx`, then:

```bash
npm run dev
```

Open `http://localhost:5173` and hit **Connect with Spotify**.

---

## How the Auth Works

SillySpotify uses **PKCE (Proof Key for Code Exchange)** — the secure OAuth flow for client-side apps that requires no client secret and no backend. The flow is:

1. App generates a random code verifier and hashes it into a code challenge
2. User is redirected to Spotify's login page with the challenge
3. Spotify redirects back with a temporary `code` in the URL
4. App exchanges the code + verifier for an access token
5. Token is stored in `sessionStorage` and used for all API calls

Tokens are never sent anywhere except Spotify's own servers. Everything stays in the browser.

---

## Scopes Requested

| Scope | Why |
|---|---|
| `user-top-read` | Top tracks and artists |
| `user-read-recently-played` | Recently played history |
| `user-read-playback-state` | Current playback info |
| `user-read-private` | Your display name and avatar |
| `user-library-read` | Saved library access |

---

## Project Structure

The entire app is a single `.jsx` file with no external dependencies beyond React itself. Styles are injected inline via a `<style>` tag so there's no CSS file to manage.

```
SillySpotify.jsx
├── SPOTIFY_CONFIG       ← your credentials go here
├── PKCE helpers         ← generateCodeVerifier, generateCodeChallenge
├── OAuth flow           ← initiateLogin, exchangeCodeForToken
├── API helpers          ← spotifyFetch wrapper
├── Inline CSS           ← full stylesheet as a template literal
└── SillySpotify()       ← main component with all UI logic
```

---

## Troubleshooting

**Blank screen after login / "Token exchange failed"**
Make sure the Redirect URI in your Spotify app dashboard exactly matches the URL in your browser, including the trailing slash.

**401 errors**
Your token expired. The app will automatically sign you out — just log in again. Spotify access tokens last 1 hour.

**"INVALID_CLIENT" on the Spotify login page**
Your Client ID is wrong or the app wasn't saved properly in the Spotify dashboard.

**Genres show nothing**
Genre data comes from your top artists. If you've been listening to very few artists or very niche ones, Spotify may not have genre tags for them.

---

## Limitations

- Access tokens expire after **1 hour** — there's no silent refresh (that requires a backend)
- The Recently Played endpoint only returns up to **50 items** from Spotify's API
- Spotify's `user-read-playback-state` scope is requested but live "now playing" display isn't implemented — easy to add if you want it
- Only works with a **Spotify Premium or Free account** that has listening history

---

## License

Do whatever you want with it. It's silly.
