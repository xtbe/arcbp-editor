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

## Scraping Images from the Wiki

The `scrape-images.js` script uses a headless browser ([Playwright](https://playwright.dev/)) to scrape blueprint images from the [Arc Raiders Fandom wiki](https://arc-raiders.fandom.com/wiki/Blueprints). A headless browser is required because the wiki renders its content dynamically with JavaScript.

The script optionally updates a local blueprints JSON file.

### Running locally (requires Node.js ≥ 22)

```bash
npm install
# Install Playwright's Chromium browser
npx playwright install --with-deps chromium

# Download images to ./images (skips existing files)
npm run scrape

# Download images and update a blueprints JSON file
node scrape-images.js --blueprints blueprints.json
```

### Running inside Docker

```bash
docker compose exec web node /opt/scraper/scrape-images.js \
  --output /usr/share/nginx/html/images
```

### Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--output` | `-o` | `./images` | Directory to save downloaded images |
| `--blueprints` | `-b` | *(none)* | Path to a blueprints JSON file — the script updates the `image` field for matching entries that don't already have one |
