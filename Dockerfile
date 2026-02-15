## Stage 1: install scraper dependencies
FROM node:20-alpine AS scraper
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY scrape-images.js ./

## Stage 2: production image (nginx + scraper)
FROM nginx:stable-alpine

# Install Node.js so the scraper can be run inside the container
RUN apk add --no-cache nodejs npm

# Copy the single-page app into the default nginx html folder
COPY bpeditor.html /usr/share/nginx/html/index.html

# Copy scraper and its dependencies
COPY --from=scraper /app /opt/scraper

EXPOSE 80

# Use the default nginx entrypoint/CMD from the base image
