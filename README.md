# Project1-ACIT-3495
## Stage 1 - Skeleton services (what we added)

This stage brings up a minimal, containerized set of services to form the skeleton of the video streaming system:

- MySQL (database) with an initial `videos` table
- Authentication service (simple Node.js service that validates a single user)
- Enter-data web service (example of a web service that calls auth and writes metadata to database)
- File System service (simple file upload and file-read service)

How to run (on your VM with Docker and Docker Compose):

1. Open a terminal in the project root (where `docker-compose.yml` is located).
2. Build and start services:

```powershell
docker-compose up --build
```

3. Expected quick checks:
- Auth service: http://localhost:4000/validate (POST with JSON {username,password})
- Enter web: http://localhost:3000/enter (POST)
- File service health: http://localhost:5000/health (GET)

We'll now proceed step-by-step. After you test Stage 1 on your VM, tell me what output you saw or any errors and we'll move to Stage 2 (upload web app).
