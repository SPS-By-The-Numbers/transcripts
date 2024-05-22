#!/bin/bash

# Stops the container if it's been runnig for too long.

# Sleep for 2 hours.
sleep $(($1 * 60 * 1000))

# Stops the container if the script takes longer than two hours, and won't
# execute if the script finishes on time (<2 hours)
read -r -d '' DATA << EOF
{"user_id": "${VAST_CONTAINERLABEL}", "auth_code": "${API_PASSWORD}"}
EOF

curl -v -X DELETE -H "Content-Type: application/json" --data "${DATA}" ${API_BASE_URL}/vast
vastai stop instance $VAST_CONTAINERID
