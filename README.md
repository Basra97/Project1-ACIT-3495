# Video Streaming (Web)

Lightweight static front‑end for browsing and playing videos. It uses mock authentication and a couple of public sample videos for now and is API‑ready for later wiring.

## Run locally

- Open `index.html` directly in a browser; or
- Serve the folder statically (avoids file:// quirks).

Windows PowerShell example (if Python is installed):

```powershell
# from the video-streaming-web folder
python -m http.server 8080
```

Then open http://localhost:8080

## Files

- `index.html` – layout with login modal, search, grid, and player modal.
- `styles.css` – minimal responsive styles.
- `app.js` – renders list, mock login, search, and player. Endpoints are configurable via localStorage keys:
  - `AUTH_BASE_URL`, `API_BASE_URL`, `FILE_BASE_URL`.

Set in DevTools console if desired:

```js
localStorage.setItem('AUTH_BASE_URL', 'http://localhost:4000');
localStorage.setItem('API_BASE_URL', 'http://localhost:5000');
localStorage.setItem('FILE_BASE_URL', 'http://localhost:6000');
```

## Next

- Replace `loginMock` with real auth call.
- Fetch video list from API (MySQL-backed) and resolve playable URLs via File System service.
- Containerize (e.g., Nginx) when ready.