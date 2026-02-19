FROM nginx:stable-alpine

# Custom nginx config: serves the SPA and proxies /api/* to PocketBase
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built SPA
COPY dist /usr/share/nginx/html

EXPOSE 80
