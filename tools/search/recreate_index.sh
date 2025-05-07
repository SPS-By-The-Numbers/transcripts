#! /bin/bash
set -euo pipefail

export MASTER_KEY=$(cat /run/secrets/meilisearch)

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

ls -l $SEARCH_DB

# Kill the meilisearch instance.
kill -INT $SEARCH_PID
