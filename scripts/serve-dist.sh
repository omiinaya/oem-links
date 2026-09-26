#!/usr/bin/env bash
# Serve the already-built dist/ with no systemd and no root.
# Useful for proving the deploy path locally. Ctrl-C to stop.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$(readlink -f "$APP_DIR")"
PORT="${PORT:-8080}"
BIND="${BIND:-127.0.0.1}"

[[ -f "$APP_DIR/dist/index.html" ]] || {
	echo "dist/ not built. Run: npm run build" >&2
	exit 1
}

exec /usr/bin/python3 "$APP_DIR/scripts/serve.py" \
	--bind "$BIND" --port "$PORT" --root "$APP_DIR/dist"
