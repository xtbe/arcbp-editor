FROM nginx:stable-alpine

# Copy the single-page app into the default nginx html folder
COPY bpeditor.html /usr/share/nginx/html/index.html

EXPOSE 80

# Use the default nginx entrypoint/CMD from the base image
