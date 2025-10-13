# Project1 – Video Streaming System

Small, containerized system with:
- Authentication Service (Node/Express)
- File System Service for uploads/serving files (Node/Express + multer)
- MySQL with schema init
- Static front-end (Video Streaming Web) served by Nginx

The Upload Web page and Streaming Web page are static (mock auth), but the front-end can talk to the services through configurable base URLs.

## 1) Clone the repo

Windows PowerShell or Linux/macOS shell:
If you are working inside a Debian VM (VirtualBox), clone inside the VM
```bash
git clone --branch testing --single-branch https://github.com/Basra97/Project1-ACIT-3495.git
cd Project1-ACIT-3495
# Switch to the testing branch
git checkout testing
```


## 2) Prerequisites

- Docker Engine and Docker Compose plugin installed and running
- Ports available: 3306 (MySQL), 4000 (Auth), 5000 (File service), 8080 (Front-end)

Debian quick install (if needed):

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

Services started:
- MySQL on 3306 (with DB `data_db` and `videos` table from `mysql/init/init.sql`)
- Auth Service on 4000
- File System Service on 5000 (persists to `./storage`)
- Front-end (Nginx) on 8080 serving `video-streaming-web/`

Check status:

```bash
docker ps
```

## 4) Try it

Open the front-end: http://localhost:8080

In the Settings modal set:
- Auth Base URL: http://localhost:4000
- API Base URL: (leave empty for now; we’ll add a catalog service later)
- File Base URL: http://localhost:5000



## 5) Stop/cleanup

```bash
docker compose down
# Or remove volumes too
docker compose down -v
```

## Troubleshooting

- YAML tabs: YAML does not allow tab indentation. This repo’s `docker-compose.yml` uses spaces. If you copy/paste and see a parse error like “found character that cannot start any token”, convert tabs to spaces:

```bash
sed -i $'s/\t/  /g' docker-compose.yml && sed -i 's/\r$//' docker-compose.yml
docker compose config  # validate
```

- Port conflicts: change host ports in `docker-compose.yml` (e.g., 8080:80 to 8081:80) if already in use.

## Front-end notes

- `video-streaming-web/index.html` – streaming page (login/settings modals, search, player)
- `video-streaming-web/upload.html` – mock upload UI
- To configure endpoints from the UI, use the Settings modal (values are saved in localStorage).

## Next steps

- Add a Catalog Service (Node + mysql2) with `GET /videos` and `POST /videos` to read/write the `videos` table.
- Wire Upload page to call Auth → File System → Catalog in sequence.