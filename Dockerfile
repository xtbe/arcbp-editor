## Stage 1: install scraper dependencies
FROM node:22-alpine AS scraper
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY scrape-images.js ./
# Install Playwright's Chromium browser
RUN npx playwright install --with-deps chromium

## Stage 2: production image (nginx + scraper)
FROM nginx:stable-alpine

# Install Node.js and dependencies needed by Playwright's Chromium
RUN apk add --no-cache nodejs npm \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Copy the single-page app into the default nginx html folder
COPY bpeditor.html /usr/share/nginx/html/index.html

# Copy scraper, its dependencies, and Playwright browsers
COPY --from=scraper /app /opt/scraper
COPY --from=scraper /root/.cache/ms-playwright /root/.cache/ms-playwright

EXPOSE 80

# Use the default nginx entrypoint/CMD from the base image
