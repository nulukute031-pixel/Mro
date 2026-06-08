#!/bin/bash
# local.sh — Executer for local sandbox bridge
TUNNEL_FILE="$(dirname "$0")/.codex-tunnel"
if [ ! -f "$TUNNEL_FILE" ]; then
  echo "Error: .codex-tunnel file not found."
  exit 1
fi

URL=$(cat "$TUNNEL_FILE" | tr -d '\r\n ')
if [ -z "$URL" ]; then
  echo "Error: Tunnel URL is empty."
  exit 1
fi

COMMAND="$@"
if [ -z "$COMMAND" ]; then
  echo "Usage: ./local.sh <command>"
  exit 1
fi

PAYLOAD=$(python3 -c 'import json, sys; print(json.dumps({"command": sys.argv[1]}))' "$COMMAND")

RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$URL/execute")
if [ $? -ne 0 ]; then
  echo "Error: Failed to connect to local sandbox bridge via $URL"
  exit 1
fi

python3 -c '
import sys, json
try:
    r = json.loads(sys.argv[1])
    if r.get("stdout"):
        sys.stdout.write(r["stdout"])
    if r.get("stderr"):
        sys.stderr.write(r["stderr"])
    sys.exit(r.get("exitCode", 0))
except Exception as e:
    print("Error parsing response:", e)
    print(sys.argv[1])
    sys.exit(1)
' "$RESPONSE"
