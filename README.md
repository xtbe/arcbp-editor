# arcbp-editor — Dockerized

This project is a single static file `bpeditor.html`. The repository includes a minimal Docker setup using `nginx:stable-alpine`.

Quick start (build + run with Docker):

```bash
# build the image
docker build -t arcbp-editor .

# run the container (maps port 8080 -> 80)
docker run --rm -p 8080:80 arcbp-editor
```

Or with Docker Compose:

```bash
docker compose up --build
# then open http://localhost:8080
```
