# 1) build the React site
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) run FastAPI, which serves the API under /api and the site everywhere else
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=web /web/dist ./static

# mount a persistent volume at /data so users and questions survive redeploys
ENV DB_PATH=/data/app.db
CMD ["sh", "-c", "mkdir -p /data && uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
