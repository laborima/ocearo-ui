#!/bin/bash
#
# Batch-generate low-poly AIS vessel models with the Meshy text-to-3D API.
#
# Setup:
#   - Put your key in models/ais/.env  ->  MESHY_API_KEY=msy_xxx   (gitignored)
#   - Then:  cd models/ais && source .env && ./generate.sh
#
# Output: GLB files land directly in the preview folder so the comparison page
#   (public/ais-preview/index.html) picks them up. Override with OUTDIR=...
#
# NOTE on the API: this uses the endpoint/params from meshy-batch-ais.json. If
#   Meshy rejects them, the current public API is the two-stage OpenAPI v2 flow:
#     POST https://api.meshy.ai/openapi/v2/text-to-3d   { "mode":"preview", "prompt":..., "art_style":"realistic", "should_remesh":true, "target_polycount":2000 }
#     -> poll GET .../openapi/v2/text-to-3d/<id> until status=SUCCEEDED, read .model_urls.glb
#   Adjust ENDPOINT / the submitted body below accordingly.

set -euo pipefail

API_KEY="${MESHY_API_KEY:-}"
OUTDIR="${OUTDIR:-../../public/ais-preview/meshy}"

command -v jq   >/dev/null || { echo "❌ jq is required"; exit 1; }
command -v curl >/dev/null || { echo "❌ curl is required"; exit 1; }
[ -n "$API_KEY" ] || { echo "❌ MESHY_API_KEY is not set (source models/ais/.env)"; exit 1; }

ENDPOINT=$(jq -r '.endpoint' meshy-batch-ais.json)
mkdir -p "$OUTDIR"

jq -c '.jobs[]' meshy-batch-ais.json | while read -r job; do

  AIS_ID=$(echo "$job" | jq -r '.id')
  PROMPT=$(echo "$job" | jq -r '.prompt')

  if [ -f "$OUTDIR/$AIS_ID.glb" ]; then
    echo "⏭  $AIS_ID already exists, skipping"
    continue
  fi

  echo "▶ Submitting $AIS_ID"

  # 1) Submit job (common params + this job's prompt)
  RESPONSE=$(jq -c --arg prompt "$PROMPT" '.common + {prompt: $prompt}' meshy-batch-ais.json \
    | curl -s -X POST "$ENDPOINT" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d @-)

  TASK_ID=$(echo "$RESPONSE" | jq -r '.task_id // .result // empty')
  if [ -z "$TASK_ID" ]; then
    echo "❌ $AIS_ID submit failed: $RESPONSE"
    continue
  fi
  echo "  ↳ task_id = $TASK_ID"

  # 2) Poll status
  STATUS="pending"
  while [[ "$STATUS" == "pending" || "$STATUS" == "processing" || "$STATUS" == "IN_PROGRESS" || "$STATUS" == "PENDING" ]]; do
    sleep 5
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" "$ENDPOINT/$TASK_ID")
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    echo "    status = $STATUS"
  done

  if [[ "$STATUS" != "completed" && "$STATUS" != "SUCCEEDED" ]]; then
    echo "❌ $AIS_ID failed (status=$STATUS)"
    continue
  fi

  # 3) Download GLB
  GLB_URL=$(echo "$STATUS_RESPONSE" | jq -r '.output.glb_url // .model_urls.glb // empty')
  if [ -z "$GLB_URL" ]; then
    echo "❌ $AIS_ID: no GLB url in response"
    continue
  fi

  echo "  ↓ Downloading $AIS_ID.glb"
  curl -s -L "$GLB_URL" -o "$OUTDIR/$AIS_ID.glb"
  echo "✅ Saved $OUTDIR/$AIS_ID.glb"
  echo

  sleep 2
done

echo "Done. Open public/ais-preview/index.html to compare."
