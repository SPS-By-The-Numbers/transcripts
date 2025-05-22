#! /bin/sh
set -euo pipefail

# gcp_key_path is for testing this image outside of Cloud Run.
# On Cloud Run, permissions are granted via the service account of the job.
gcp_key_path=/run/secrets/gcp.json
if [ -e "$gcp_key_path" ]; then
    gcloud auth activate-service-account "--key-file=$gcp_key_path"
else
  export CLOUDSDK_AUTH_ACCESS_TOKEN=$(curl -s -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" | jq -r .access_token)
fi

# Download the index from Cloud Storage.
mkdir -p "$SEARCH_DIR"
gcloud storage cp --project "$GCP_PROJECT_ID" \
    --recursive "gs://$GCP_BUCKET/data.ms" "$SEARCH_DIR"

exec /bin/meilisearch "--db-path=$SEARCH_DB" "--master-key=$MEILISEARCH_MASTER_KEY"
