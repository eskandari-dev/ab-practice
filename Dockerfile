# 1) build the React site
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# baked into the JS/HTML at build time (override with docker --build-arg)
ARG VITE_SITE_URL=https://rr.kyzed.com
ARG VITE_GA_MEASUREMENT_ID=
ARG VITE_GSC_VERIFICATION=
ENV VITE_SITE_URL=$VITE_SITE_URL \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID \
    VITE_GSC_VERIFICATION=$VITE_GSC_VERIFICATION
RUN npm run build

# 2) run FastAPI, which serves the API under /api and the site everywhere else
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=web /web/dist ./static

# without DATABASE_URL (Postgres) the app uses SQLite here; mount a persistent volume at /data to keep it
ENV DB_PATH=/data/app.db
CMD ["sh", "-c", "mkdir -p /data && uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
