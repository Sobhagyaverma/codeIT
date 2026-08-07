# Build Stitch UI and serve behind Nginx (same-origin /api /ws /sync)
FROM node:22-alpine AS frontend-build
WORKDIR /ui
COPY frontend-stitch/package.json frontend-stitch/package-lock.json* ./
RUN npm ci
COPY frontend-stitch/ ./
# Same-origin: leave VITE_* empty so the browser uses /api, /ws, /sync on this host
ENV VITE_API_URL= \
    VITE_SYNC_WS_URL=
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /ui/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
