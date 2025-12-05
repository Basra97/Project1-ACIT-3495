# Project1 – Video Streaming System (Report)

This is a microservices-based video platform: users sign in, upload a video, metadata is saved to MySQL, and the web app lists and plays it. JWT is used for authentication across services.

---

## 1. Abstract

Build a small, containerized video platform to demonstrate microservices, inter-service communication, and end-to-end auth. The system consists of: Authentication (JWT), File System (upload/serve/delete), Catalog (MySQL metadata), and a static Web UI. The UI talks to each service directly using configured base URLs.

## 2. Objectives

- Implement a minimal, working microservices system with clear responsibilities per service.
- Secure create/delete operations and viewing via JWT.
- Provide a clean web UI for login, upload, listing, preview, playback, and delete.
- Package the stack with Docker Compose for easy running and grading.

## 3. Architecture Overview

Services and communication:

```
Web UI (Nginx, port 8080)
	 ├── Auth Service (Express, 4000): issues/verifies JWT
	 ├── Catalog Service (Express + MySQL, 5001): video records
	 └── File System Service (Express + Multer, 5000): file storage/serving

MySQL (3306) ⟵ used by Catalog Service
```

All services are containerized and wired via `docker-compose.yml`. The browser includes the JWT in Authorization headers; for media reads, the token is also supported via a `?token=` query parameter.

## 4. Components

- Web App (video-streaming-web, served by Nginx on 8080)
	- Settings to configure Base URLs for Auth (4000), Catalog (5001), File (5000)
	- Session-based token storage
	- Upload form with client-side thumbnail capture and hover preview

- Authentication Service (port 4000)
	- Endpoints: `POST /login`, `POST /signup`, `POST /verify`, `POST /validate`
	- Issues JWT: HS256 with issuer from env; ephemeral in-memory users (seeded by env)

- File System Service (port 5000)
	- Endpoints: `POST /upload` (JWT), `GET/HEAD /files/*` (JWT required), `DELETE /files/:name` (JWT)
	- Stores files under a volume (`./storage` ⇄ `/data/files`)

- Catalog Service (port 5001)
	- Endpoints: `GET /videos` (JWT), `POST /videos` (JWT), `DELETE /videos/:id` (JWT)
	- Persists metadata to MySQL; ensures optional `thumb` column

- MySQL (port 3306)
	- Database: `data_db`
	- Table: `videos` (created via `mysql/init/init.sql`)

## 5. Data Model

Table `videos`:
- `id` INT, PK, auto-increment
- `title` VARCHAR(255)
- `path` VARCHAR(1024) – file path returned by File service (e.g., `/files/<name>.mp4`)
- `thumb` VARCHAR(1024) – optional thumbnail path (e.g., `/files/<name>.png`)
- `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 6. Authentication & Authorization

- JWT issued by Auth Service with configurable `JWT_SECRET`, `JWT_ISSUER`, `JWT_EXPIRES_IN`.
- UI stores the token for the current browser session.
- API calls include `Authorization: Bearer <token>`.
- Media reads support `?token=<jwt>` so `<video src>` can stream protected files.

## 7. User Flows

1) Sign up or Log in → receive JWT
2) Upload → UI POSTs file to File service with Authorization; receives stored path
3) Save metadata → UI POSTs `{ title, path, thumb }` to Catalog with Authorization
4) Browse/Stream → UI GETs `/videos` with Authorization; `<video>` uses File Base URL + `path` + `?token=`
5) Delete → UI calls Catalog delete and attempts to remove the stored file



## 8. Setup & Run (Docker Compose)


```
mkdir storage
docker compose up -d --build
```

Open the Web UI: http://localhost:8080

In Settings (top-right):
- Auth Base URL: http://localhost:4000
- API Base URL: http://localhost:5001
- File Base URL: http://localhost:5000

## 9. Validation & Quick Checks

- Stack status: `docker compose ps`
- Database peek:
	- `docker compose exec mysql mysql -uroot -pexample -e "USE data_db; SELECT id,title,path,thumb,uploaded_at FROM videos ORDER BY uploaded_at DESC LIMIT 10;"`

## 10. Results

- Upload creates a stored file and a catalog record.
- Thumbnails captured client-side; hover preview on cards.
- All create, delete, list, and file reads are JWT-protected; the UI forwards the token.

