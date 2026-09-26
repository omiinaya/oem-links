#!/usr/bin/env bash
# Serve the already-built dist/ on :8080 to prove the deploy path works.
# No systemd, no root, no nginx. Ctrl-C to stop.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8080}"

[[ -f "$APP_DIR/dist/index.html" ]] || {
	echo "dist/ not built. Run: npm run build" >&2
	exit 1
}

cd "$APP_DIR"
echo "==> serving $APP_DIR/dist on http://127.0.0.1:${PORT}/"
exec npx --yes serve dist --listen "$PORT" --no-clipboard
