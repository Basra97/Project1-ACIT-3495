# Project1 – Video Streaming System

Containerized microservices + static front-end:
- Authentication Service (Node/Express)
- File System Service for uploads and serving files (Node/Express + Multer)
- MySQL with schema init
- Catalog Service (Node/Express + mysql2) for listing/registering videos
- Static front-end (Nginx) serving `video-streaming-web/`

The front-end is backend-only: Upload calls File System → Catalog; Streaming lists from Catalog. Login is a simple credential check via the Auth service `/validate` endpoint (no tokens).

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
- auth-service: 4000 – `/validate`
- Auth defaults (in-memory):
	- Username: `admin`
	- Password: `admin123`
	- Override with `DEFAULT_ADMIN_USER` and `DEFAULT_ADMIN_PASS`.
- file-system-service: 5000 – `/upload`, `/files/*` static, `DELETE /files/:name`
- catalog-service: 5001 – `GET/POST /videos`, `DELETE /videos/:id`
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

Streaming page:
- Lists items from Catalog (no sample or local items)
- Delete removes from Catalog (and attempts to delete the stored file)

Quick API checks (curl):

```bash
# Auth (simple validate)
curl -s -X POST http://localhost:4000/validate \
	-H 'content-type: application/json' \
	-d '{"username":"admin","password":"admin123"}'

# File upload (Linux/Debian example)
echo "hello" > /tmp/test.txt
curl -s -F file=@/tmp/test.txt http://localhost:5000/upload

# Catalog list + create
curl -s http://localhost:5001/videos
curl -s -X POST http://localhost:5001/videos \
	-H 'content-type: application/json' \
	-d '{"title":"Test Text","path":"/files/<name>"}'
```

Windows PowerShell equivalents:

```powershell
# List
irm http://localhost:5001/videos | ConvertTo-Json -Depth 3
# Upload a file (adjust path) and then create a catalog entry
$res = Invoke-RestMethod -Uri http://localhost:5000/upload -Method Post -Form @{ file = Get-Item '.\sample.mp4' }
Invoke-RestMethod -Uri http://localhost:5001/videos -Method Post -ContentType 'application/json' -Body (@{ title = 'Sample'; path = $res.path } | ConvertTo-Json)
irm http://localhost:5001/videos | ConvertTo-Json -Depth 3
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
- Authentication Service: `/validate` (CORS). In-memory credentials (admin/admin123 by default)
- File System Service: `/upload`, static `/files/*`, `DELETE /files/:name` (CORS). Filenames sanitized and storage directory ensured.
- Catalog Service: `GET /videos`, `POST /videos`, `DELETE /videos/:id` (CORS)
- MySQL: schema `videos(id, title, path, uploaded_at)`
- Docker Compose stack and Nginx static hosting

Partially implemented
- Deletion from UI attempts file deletion (best-effort). If file is missing, the UI still removes the row and shows a cleanup note.

Not implemented yet
- Strong auth/session management (no JWT/tokens). Login is a simple credential check to unlock UI actions; backend endpoints are open for the assignment's minimum.
- Video thumbnails or transcoding pipeline
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
- Add thumbnails and/or streaming-optimized formats
- Improve error surfaces and add loading states to the Streaming page
