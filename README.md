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

## Images

Blueprint images are served from a local `images/` folder that is bind-mounted into the container. Place your image files in the `images/` directory at the project root, then reference them using relative paths (e.g. `images/anvil.png`) in the editor's **Image** field.

Docker Compose automatically mounts `./images` as a read-only volume. When running with plain Docker, add the mount manually:

```bash
docker run --rm -p 8080:80 -v ./images:/usr/share/nginx/html/images:ro arcbp-editor
```
