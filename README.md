# Project1 – Video Streaming System

Containerized microservices + static front-end:
- Authentication Service (Node/Express)
- File System Service for uploads and serving files (Node/Express + Multer)
- MySQL with schema init
- Catalog Service (Node/Express + mysql2) for listing/registering videos
- Static front-end (Nginx) serving `video-streaming-web/`

The front-end is backend-only: Upload calls File System → Catalog; Streaming lists from Catalog. Authentication uses a minimal JWT: the web app logs in to obtain a token and sends it to protected APIs. File reads are protected and the app appends `?token=...` to media URLs so the browser can stream.

---

## 1) Clone the repo

Windows PowerShell or Debian shell. If you run Docker inside a Debian VM, clone inside that VM.

```bash
git clone --branch testing --single-branch https://github.com/Basra97/Project1-ACIT-3495.git
cd Project1-ACIT-3495
git checkout testing
```

## 2) Prerequisites

- Docker Engine and Docker Compose plugin
- Ports free: 3306 (MySQL), 4000 (Auth), 5000 (File), 5001 (Catalog), 8080 (Front-end)

Debian quick install (optional):

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release; echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

## 3) Start the stack

From the repo root:

```bash
mkdir -p storage
docker compose up -d --build
```

Services:
- mysql: 3306 (DB `data_db`, table `videos`) – schema from `mysql/init/init.sql`
- auth-service: 4000 – `/login` (JWT), `/signup` (in-memory), `/verify` (diagnostic), `/validate` (legacy)
- Auth defaults (in-memory):
	- Username: `admin`
	- Password: `admin123`
	- Override with `DEFAULT_ADMIN_USER` and `DEFAULT_ADMIN_PASS`.
- file-system-service: 5000 – `/upload` (JWT), `/files/*` reads require JWT (Authorization header or `?token=`), `DELETE /files/:name` (JWT)
- catalog-service: 5001 – `GET /videos` (JWT), `POST /videos` (JWT), `DELETE /videos/:id` (JWT). Stores optional `thumb` path.
- video-web: 8080 – serves `video-streaming-web/`

Check status:

```bash
docker compose ps
```

## 4) Use it

Open the front-end: http://localhost:8080

Settings modal values:
- Auth Base URL: http://localhost:4000
- API Base URL: http://localhost:5001
- File Base URL: http://localhost:5000

Upload page flow:
1) POST /upload to File System → returns `{ path: "/files/<name>" }`
2) POST /videos to Catalog with `{ title, path }`
3) On success: toast “Upload complete” and redirect to Streaming page
4) On failure: toast shows the error (no local fallback)

Optional:
- The UI captures a single deterministic thumbnail frame client-side (browser-decoding permitting), uploads it to the File service, and includes `thumb` when saving to the Catalog.

Streaming page:
- Requires login (the app will prompt you)
- Lists items from Catalog (no sample or local items) and sends Authorization to Catalog
- Video and thumbnail URLs include `?token=<JWT>` for protected reads
- Delete removes from Catalog (and attempts to delete the stored file)
- Shows a static thumbnail per video; hovering/focusing a card plays a muted looping preview inside the card

Quick API checks (curl):

```bash
# Login (JWT)
TOKEN=$(curl -s -X POST http://localhost:4000/login \
  -H 'content-type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# File upload (Linux/Debian example)
echo "hello" > /tmp/test.txt
curl -s -F file=@/tmp/test.txt -H "Authorization: Bearer $TOKEN" http://localhost:5000/upload

# Catalog list + create (JWT)
curl -s http://localhost:5001/videos -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:5001/videos \
  -H 'content-type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Text","path":"/files/<name>"}'
```

Windows PowerShell equivalents:

```powershell
# Login (JWT)
$login = Invoke-RestMethod -Uri http://localhost:4000/login -Method Post -ContentType 'application/json' -Body (@{ username = 'admin'; password = 'admin123' } | ConvertTo-Json)
$TOKEN = $login.token
# Upload a file (adjust path) and then create a catalog entry
$res = Invoke-RestMethod -Uri http://localhost:5000/upload -Method Post -Headers @{ Authorization = "Bearer $TOKEN" } -Form @{ file = Get-Item '.\sample.mp4' }
Invoke-RestMethod -Uri http://localhost:5001/videos -Method Post -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType 'application/json' -Body (@{ title = 'Sample'; path = $res.path } | ConvertTo-Json)
# List (JWT)
Invoke-RestMethod -Uri http://localhost:5001/videos -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 3
```

## 5) Stop/cleanup

```bash
docker compose down
# Remove volumes too (DB reset)
docker compose down -v
```

---

## What’s implemented vs requirements

Based on the requirements and flow chart (Auth → File System → Catalog → Streaming UI):

Implemented
- Front-end: Streaming page (search, player, settings), Upload page with “Uploading…” indicator and detailed error toasts
- Authentication Service: `/login` (JWT), `/signup` (ephemeral), `/verify`, `/validate` (legacy). In-memory credentials (admin/admin123 by default)
- File System Service: `/upload` (JWT), static `/files/*` reads (JWT), `DELETE /files/:name` (JWT). Filenames sanitized and storage directory ensured.
- Catalog Service: `GET /videos` (JWT), `POST /videos` (JWT), `DELETE /videos/:id` (JWT) (CORS)
- MySQL: schema `videos(id, title, path, uploaded_at)` (UI/runtime may add a `thumb` column at startup if missing)
- Docker Compose stack and Nginx static hosting

Additional UI behavior
- Thumbnails: client-side single-frame capture on upload (deterministic) saved to File service and referenced as `thumb` in Catalog when available; if `thumb` is missing, the UI may capture one at runtime and cache it for the session.
- Hover preview: plays a muted looping preview within the card without leaving the page.

Partially implemented
- Deletion from UI attempts file deletion (best-effort). If file is missing, the UI still removes the row and shows a cleanup note.

Not implemented yet
- Strong auth/session management (no JWT/tokens). Login is a simple credential check to unlock UI actions; backend endpoints are open for the assignment's minimum.
- Server-side thumbnailing/transcoding pipeline (current thumbnails are client-side only)
- File size/type validation and error localization
- Deduplication between local-only entries and Catalog items once they appear in the DB


---

## Troubleshooting

- ENOENT errors on file-service during upload
	- Ensure the host directory exists and is writable: `mkdir -p storage` and ensure Docker mount maps `./storage:/data/files`
	- Rebuild and restart only that service: `docker compose build file-system-service && docker compose up -d file-system-service`
- See container logs
	- `docker compose ps`
	- `docker compose logs -n 200 file-system-service`
	- `docker compose logs -n 200 catalog-service`
	- `docker compose logs -n 200 auth-service`
- CORS
	- All services have CORS enabled; if you added gateways/proxies, ensure they allow DELETE/POST headers
- Port conflicts
	- Adjust host ports in `docker-compose.yml` (e.g., change 8080:80)
 - Thumbnails not visible
	- Ensure Settings have correct File Base URL (e.g., http://localhost:5000)
	- Confirm `GET http://localhost:5001/videos` returns `thumb` for rows uploaded after this feature
	- Check that `http://localhost:5000/files/*.png` requests return 200 in the browser Network tab
 - Preview not playing
	- Previews are muted and should autoplay; if blocked, click once anywhere on the page
	- Verify the video URL resolves (Catalog `path` + File Base URL) and the codec is browser-decodable (H.264 MP4 recommended)

Removed
	- The database no longer stores users; the Auth service uses in-memory defaults for simplicity.

---

## Handover checklist (for next developer)

1) Pull latest and start: `mkdir -p storage && docker compose up -d --build`
2) Open http://localhost:8080 and set Settings as above
3) Upload a small file to validate end-to-end; check `http://localhost:5001/videos`
4) Delete a video from the UI; verify it disappears from the list; optional: check file removal under `storage/`
5) If any step fails, check service logs with `docker compose logs -n 200 <service>`

Suggested next tasks
- Enforce auth (JWT/session) on all endpoints; pass token from front-end
- Add server-side thumbnail/transcoding (ffmpeg) and/or streaming-optimized formats
- Improve error surfaces and add loading states to the Streaming page
