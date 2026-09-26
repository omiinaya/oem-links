#!/usr/bin/env bash
# Build oem/links and serve dist/ from a systemd unit + nginx.
#
# Idempotent: safe to re-run. Usage:
#   sudo ./setup.sh                     # install and start on :8080
#   PORT=8090 sudo -E ./setup.sh        # different port
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
SERVICE=oem-links
UNIT=/etc/systemd/system/${SERVICE}.service

if [[ $EUID -ne 0 ]]; then
	echo "error: run as root (it writes ${UNIT})" >&2
	exit 1
fi

command -v node >/dev/null || { echo "error: node is required" >&2; exit 1; }
command -v npm  >/dev/null || { echo "error: npm is required" >&2; exit 1; }

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 22 )); then
	echo "error: node >=22.12 required (found $(node -v))" >&2
	exit 1
fi

echo "==> installing deps"
cd "$APP_DIR"
npm ci --no-audit --no-fund

echo "==> running content tests"
npm test

echo "==> building"
npm run build

[[ -f dist/index.html ]] || { echo "error: dist/index.html missing after build" >&2; exit 1; }

echo "==> writing ${UNIT}"
cat > "$UNIT" <<EOF
[Unit]
Description=oem/links static site
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/env npx --yes serve dist --listen ${PORT} --no-clipboard
Restart=on-failure
RestartSec=5
# this is a static file server, it needs nothing
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=${APP_DIR}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "==> enabling service"
systemctl daemon-reload
systemctl enable --now "$SERVICE"

sleep 2
if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/"; then
	echo "==> up: http://127.0.0.1:${PORT}/"
	echo "    nginx: proxy_pass http://127.0.0.1:${PORT};  (set server_name + TLS as usual)"
else
	echo "error: service did not answer on ${PORT}. Check: journalctl -u ${SERVICE} -n 50" >&2
	exit 1
fi
