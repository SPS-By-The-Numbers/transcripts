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

# Make sure the bucket is accessible, before starting the indexing process.
gcloud storage ls "gs://$GCP_BUCKET"

# This key is for testing.
# The key must be at least 16 bytes long.
# https://www.meilisearch.com/docs/learn/security/basic_security#creating-the-master-key-in-a-self-hosted-instance
export MASTER_KEY='MEILI-9133dcf0-d6d9-4d24-a217-ae68fdb04475'

nohup /usr/local/bin/meilisearch --db-path=$SEARCH_DB --master-key="$MASTER_KEY" &
SEARCH_PID=$!

# Wait until health check comes back with 200.
until curl --silent -X -f "http://127.0.0.1:7700/health"
do
  sleep 1
done

# Register the key UID. The same (Master Key, UID) pair will generate the same key.
until curl --silent -X POST -H "Content-Type: application/json" --data-binary '{"name":"Transcript Front Search", "description":"Transcript Frontend Search Access", "uid": "fa82128d-a898-42ca-86eb-0e056195a111", "actions": ["search"], "indexes":["*"], "expiresAt": null}' -H "Authorization: Bearer $MASTER_KEY" -s -f -o /dev/null "http://127.0.0.1:7700/keys"
do
  sleep 1
done

# Recreate index
npx tsx tools/search/setup.mts
npx tsx tools/search/recreate_index.mts

gcloud storage cp --project "$GCP_PROJECT_ID" --recursive "$SEARCH_DB" "gs://$GCP_BUCKET"

# Kill the meilisearch instance.
kill -INT $SEARCH_PID
