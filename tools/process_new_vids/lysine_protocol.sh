#!/bin/bash

source /workspace/venv/vast/bin/activate

# Stops the container if it's been running for too long.

# Sleep for 2 hours.
sleep $((${1:-120} * 60))

# Stops the container if the script takes longer than two hours, and won't
# execute if the script finishes on time (<2 hours)
read -r -d '' DATA << EOF
{"user_id": "${CONTAINER_ID}", "auth_code": "${API_PASSWORD}"}
EOF

curl -v -X DELETE -H "Content-Type: application/json" --data "${DATA}" https://vast-${API_BASE_URL}
vastai destroy instance $CONTAINER_ID
