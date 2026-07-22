#!/bin/bash
#
# Batch-generate low-poly AIS vessel models with the Tripo 3D API (free tier).
# Reuses the prompts from meshy-batch-ais.json (.jobs[].prompt / .id and
# .common.negative_prompt) — only the provider differs.
#
# Get an API key:  https://platform.tripo3d.ai  ->  API Keys  ->  starts with tsk_
# Setup:
#   echo 'TRIPO_API_KEY=tsk_xxx' >> models/ais/.env   (gitignored)
#   cd models/ais && source .env && ./generate-tripo.sh
#
# Output GLB files land in public/ais-preview/meshy/ (where the comparison page
# reads them). Override with OUTDIR=...
#
# Free tier limits ~10 models/day: if you hit the quota, just rerun tomorrow —
# already-downloaded files are skipped, so it resumes where it stopped.

set -uo pipefail

# Auto-load .env (so a plain `./generate-tripo.sh` works without `source .env`)
[ -f .env ] && { set -a; . ./.env; set +a; }

API_KEY="${TRIPO_API_KEY:-}"
OUTDIR="${OUTDIR:-../../public/ais-preview/meshy}"
BASE="https://api.tripo3d.ai/v2/openapi"

command -v jq   >/dev/null || { echo "❌ jq is required"; exit 1; }
command -v curl >/dev/null || { echo "❌ curl is required"; exit 1; }
[ -n "$API_KEY" ] || { echo "❌ TRIPO_API_KEY is not set (add it to models/ais/.env then 'source .env')"; exit 1; }

NEG=$(jq -r '.common.negative_prompt // ""' meshy-batch-ais.json)
# Optional whitelist: IDS="ais-20 ais-30 ..." generates only those (saves credits).
IDS="${IDS:-}"
mkdir -p "$OUTDIR"

jq -c '.jobs[]' meshy-batch-ais.json | while read -r job; do

  ID=$(echo "$job" | jq -r '.id')
  PROMPT=$(echo "$job" | jq -r '.prompt')

  if [ -n "$IDS" ] && [[ " $IDS " != *" $ID "* ]]; then
    continue
  fi

  if [ -f "$OUTDIR/$ID.glb" ]; then
    echo "⏭  $ID already exists, skipping"
    continue
  fi

  echo "▶ Submitting $ID"

  # 1) Create task (text_to_model). texture/pbr off -> clean untextured low-poly mesh.
  BODY=$(jq -nc --arg p "$PROMPT" --arg n "$NEG" \
    '{type:"text_to_model", prompt:$p, negative_prompt:$n, texture:false, pbr:false}')

  RESP=$(curl -s -X POST "$BASE/task" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$BODY")

  CODE=$(echo "$RESP" | jq -r '.code // empty')
  TASK=$(echo "$RESP" | jq -r '.data.task_id // empty')
  if [ "$CODE" != "0" ] || [ -z "$TASK" ]; then
    echo "❌ $ID submit failed: $RESP"
    continue
  fi
  echo "  ↳ task_id = $TASK"

  # 2) Poll until terminal status
  STATUS_RESPONSE=""
  while true; do
    sleep 5
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" "$BASE/task/$TASK")
    ST=$(echo "$STATUS_RESPONSE" | jq -r '.data.status // "unknown"' | tr '[:upper:]' '[:lower:]')
    PROG=$(echo "$STATUS_RESPONSE" | jq -r '.data.progress // 0')
    echo "    status = $ST (${PROG}%)"
    case "$ST" in
      success) break ;;
      failed|banned|cancelled|expired|unknown) echo "❌ $ID failed: $STATUS_RESPONSE"; TASK=""; break ;;
    esac
  done
  [ -z "$TASK" ] && continue

  # 3) Download GLB (prefer pbr_model, fall back to base model)
  URL=$(echo "$STATUS_RESPONSE" | jq -r '.data.output.pbr_model // .data.output.model // .data.result.pbr_model // .data.result.model // empty')
  if [ -z "$URL" ]; then
    echo "❌ $ID: no GLB url in response: $STATUS_RESPONSE"
    continue
  fi

  echo "  ↓ Downloading $ID.glb"
  curl -s -L "$URL" -o "$OUTDIR/$ID.glb"
  echo "✅ Saved $OUTDIR/$ID.glb"
  echo

  sleep 2
done

echo "Done. Open public/ais-preview/ to compare (column 'Généré par Meshy' now shows Tripo models)."
