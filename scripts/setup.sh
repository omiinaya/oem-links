#!/usr/bin/env bash
# Build oem/links and serve dist/ from a systemd unit.
#
# Idempotent: safe to re-run. Usage:
#   ./setup.sh                          # install and start on :8080, bound to LAN
#   PORT=8090 ./setup.sh                # different port
#   BIND=127.0.0.1 ./setup.sh           # loopback only (default posture is LAN)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$(readlink -f "$APP_DIR")"
PORT="${PORT:-8080}"
BIND="${BIND:-0.0.0.0}"
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

# /root is where the convenience symlink lives, but the real tree is on the
# thunder NFS mount. The unit runs from the resolved path so ProtectHome can
# stay on (it would otherwise make /root unreadable and 404 every file).
if [[ "$APP_DIR" == /root/* ]]; then
	echo "error: ${APP_DIR} is under /root; the unit protects /root." >&2
	echo "       run setup.sh from the real project path, not the /root symlink." >&2
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
ExecStart=/usr/bin/python3 ${APP_DIR}/scripts/serve.py --bind ${BIND} --port ${PORT} --root ${APP_DIR}/dist
Restart=on-failure
RestartSec=5

# Static file server: it needs no privileges, no home, no writes.
User=nobody
Group=nogroup
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
ReadOnlyPaths=${APP_DIR}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "==> enabling service"
systemctl daemon-reload
systemctl enable --now "$SERVICE"

# Readiness: poll rather than a blind sleep. Errors are expected while the
# unit is still starting, so keep them off stderr.
for _ in $(seq 1 25); do
	curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null && break
	sleep 0.4
done

if ! curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/"; then
	echo "error: service did not answer on ${PORT}. Check: journalctl -u ${SERVICE} -n 50" >&2
	exit 1
fi

LAN_IP="$(hostname -I | awk '{print $1}')"
echo "==> up"
echo "    loopback: http://127.0.0.1:${PORT}/"
if [[ "$BIND" == "0.0.0.0" ]]; then
	echo "    LAN:      http://${LAN_IP}:${PORT}/"
else
	echo "    bound to ${BIND} only (not reachable from other devices)"
fi
