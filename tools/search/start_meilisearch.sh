#! /bin/bash
set -euo pipefail

# TODO: download stuff from Google Cloud Storage to /meili_data/data.ms

exec /bin/meilisearch --master-key=$(cat /run/secrets/meilisearch)
