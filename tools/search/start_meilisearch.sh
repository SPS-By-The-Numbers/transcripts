#! /bin/sh
set -euo pipefail

# gcp_key_path is for testing this image outside of Cloud Run.
# On Cloud Run, permissions are granted via the service account of the job.
gcp_key_path=/run/secrets/gcp.json
if [[ -e "$gcp_key_path" ]]; then
    gcloud auth activate-service-account "--key-file=$gcp_key_path"
fi

# This key is for testing.
# The key must be at least 16 bytes long.
# https://www.meilisearch.com/docs/learn/security/basic_security#creating-the-master-key-in-a-self-hosted-instance
MASTER_KEY='MEILI-9133dcf0-d6d9-4d24-a217-ae68fdb04475'

# Download the index from Cloud Storage.
mkdir -p "$SEARCH_DIR"
gcloud storage cp --project "$GCP_PROJECT_ID" \
    --recursive "gs://$GCP_BUCKET/data.ms" "$SEARCH_DIR"

exec /bin/meilisearch "--db-path=$SEARCH_DB" "--master-key=$MASTER_KEY"
