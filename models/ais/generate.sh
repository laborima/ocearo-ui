#!/bin/bash

set -e

API_KEY="$MESHY_API_KEY"
ENDPOINT=$(jq -r '.endpoint' meshy-batch-ais.json)

mkdir -p models

jq -c '.jobs[]' meshy-batch-ais.json | while read job; do

  AIS_ID=$(echo "$job" | jq -r '.id')
  PROMPT=$(echo "$job" | jq -r '.prompt')

  echo "▶ Submitting $AIS_ID"

  # 1️⃣ Submit job
  RESPONSE=$(jq -c --arg prompt "$PROMPT" '
      .common + {prompt: $prompt}
    ' meshy-batch-ais.json | \
    curl -s -X POST "$ENDPOINT" \
      -H "Authorization: Bearer '"$API_KEY"'" \
      -H "Content-Type: application/json" \
      -d @-
  )

  TASK_ID=$(echo "$RESPONSE" | jq -r '.task_id')

  echo "  ↳ task_id = $TASK_ID"

  # 2️⃣ Poll status
  STATUS="pending"
  while [[ "$STATUS" == "pending" || "$STATUS" == "processing" ]]; do
    sleep 5
    STATUS_RESPONSE=$(curl -s \
      -H "Authorization: Bearer $API_KEY" \
      "$ENDPOINT/$TASK_ID"
    )
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    echo "    status = $STATUS"
  done

  if [[ "$STATUS" != "completed" ]]; then
    echo "❌ $AIS_ID failed"
    continue
  fi

  # 3️⃣ Download GLB
  GLB_URL=$(echo "$STATUS_RESPONSE" | jq -r '.output.glb_url')

  echo "  ↓ Downloading $AIS_ID.glb"
  curl -s -L "$GLB_URL" -o "models/$AIS_ID.glb"

  echo "✅ Saved models/$AIS_ID.glb"
  echo

  sleep 2
done
