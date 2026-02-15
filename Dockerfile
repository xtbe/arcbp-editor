## Stage 1: install scraper dependencies (including Chromium for Puppeteer)
FROM node:20-alpine AS scraper
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY scrape-images.js ./

## Stage 2: production image (nginx + scraper)
FROM nginx:stable-alpine

# Install Node.js and Chromium so the scraper can be run inside the container
RUN apk add --no-cache nodejs npm chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy the single-page app into the default nginx html folder
COPY bpeditor.html /usr/share/nginx/html/index.html

# Copy scraper and its dependencies
COPY --from=scraper /app /opt/scraper

EXPOSE 80

# Use the default nginx entrypoint/CMD from the base image
