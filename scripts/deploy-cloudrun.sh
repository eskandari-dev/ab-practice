#!/usr/bin/env bash
# First-time + repeat deploy of Road Ready to Google Cloud Run.
# Run from the repo root on a machine with gcloud installed.
#
# Prerequisites (one-time, in Google Cloud Console with the kyzed Gmail):
#   1. Create a project (e.g. road-ready) and enable billing
#   2. Enable APIs: Cloud Run, Artifact Registry, Cloud Build
#   3. Create Artifact Registry repo: road-ready (Docker, same region)
#
# Usage:
#   export PROJECT_ID=your-gcp-project-id
#   export REGION=europe-west1          # optional
#   export GA_ID=G-XXXXXXXX            # optional until Analytics is ready
#   export GSC_TOKEN=...               # optional until Search Console verify
#   bash scripts/deploy-cloudrun.sh

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your GCP project id}"
REGION="${REGION:-europe-west1}"
SERVICE="${SERVICE:-road-ready}"
SITE_URL="${SITE_URL:-https://rr.kyzed.com}"
GA_ID="${GA_ID:-}"
GSC_TOKEN="${GSC_TOKEN:-}"
REPO="road-ready"

echo "==> Using project $PROJECT_ID in $REGION"
gcloud config set project "$PROJECT_ID"

echo "==> Ensuring Artifact Registry repo exists"
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "$REPO" \
       --repository-format=docker \
       --location="$REGION" \
       --description="Road Ready container images"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}"

echo "==> Building and pushing $IMAGE"
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_SERVICE=${SERVICE},_SITE_URL=${SITE_URL},_GA_ID=${GA_ID},_GSC_TOKEN=${GSC_TOKEN}"

echo "==> Reminder: set runtime env on the service (Neon, Firebase, admin, OpenAI):"
echo "    gcloud run services update ${SERVICE} --region=${REGION} \\"
echo "      --set-env-vars=FRONTEND_URL=${SITE_URL},DATABASE_URL=...,FIREBASE_API_KEY=...,FIREBASE_PROJECT_ID=...,ADMIN_EMAILS=alireza.es@gmail.com,SUPPORT_EMAIL=..."
echo ""
echo "Done. Service URL:"
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)'
