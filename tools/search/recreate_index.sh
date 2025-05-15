#! /bin/bash
set -euo pipefail

master_key_path=/run/secrets/meilisearch
if [[ ! -e "$master_key_path" ]]; then
    echo "failed to find $master_key_path"
    exit 1
fi
export MASTER_KEY=$(cat "$master_key_path")

gcp_key_path=/run/secrets/gcp.json

nohup ${SEARCH_DIR}/meilisearch --db-path=$SEARCH_DB --master-key="$MASTER_KEY" &
SEARCH_PID=$!

# Wait until health check comes back with 200.
until curl -X -f "http://127.0.0.1:7700/health"
do
  sleep 1
done

# Register the key UID. The same (Master Key, UID) pair will generate the same key.
until curl -X POST -H "Content-Type: application/json" --data-binary '{"name":"Transcript Front Search", "description":"Transcript Frontend Search Access", "uid": "fa82128d-a898-42ca-86eb-0e056195a111", "actions": ["search"], "indexes":["*"], "expiresAt": null}' -H "Authorization: Bearer $MASTER_KEY" -s -f -o /dev/null "http://127.0.0.1:7700/keys"
do
  sleep 1
done

# Recreate index
npx tsx tools/search/setup.mts
npx tsx tools/search/recreate_index.mts

# For testing this image outside of Cloud Run.
# On Cloud Run, we should use its service identity instead.
if [[ -e $gcp_key_path ]]; then
    gcloud auth activate-service-account "--key-file=$gcp_key_path"
fi

gcloud storage cp --project "$GCP_PROJECT_ID" --recursive "$SEARCH_DB" "gs://$GCP_BUCKET"

# Kill the meilisearch instance.
kill -INT $SEARCH_PID
