#!/usr/bin/env bash
# Post-merge smoke check: boots the server and exercises the two paths a user
# actually hits. If this fails on main, the delivery station opens a revert PR.
set -euo pipefail

PORT="${PORT:-4173}"
PORT="$PORT" npx tsx src/server.ts &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

up=""
for _ in $(seq 1 40); do
  if curl -fsS "http://localhost:$PORT/healthz" >/dev/null 2>&1; then
    up=1
    break
  fi
  sleep 0.25
done
if [ -z "$up" ]; then
  echo "server never became healthy on :$PORT" >&2
  exit 1
fi

if ! curl -fsS "http://localhost:$PORT/" | grep -q tinylinks; then
  echo "browser UI at / did not serve the expected page" >&2
  exit 1
fi

SLUG=$(curl -fsS -X POST "http://localhost:$PORT/links" \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com"}' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).slug))')

STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/$SLUG")
if [ "$STATUS" != "302" ]; then
  echo "expected 302 from redirect, got $STATUS" >&2
  exit 1
fi

echo "smoke check passed: UI served, created /$SLUG, and the redirect returned 302"
