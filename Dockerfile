# Build oem/links and serve dist/ with the repo's dependency-free python server.
# Used as the Coolify application build pack: "static".
#   Build:   npm ci --no-audit --no-fund && SITE_BASE=/ npm run build
#   Start:   python3 /app/scripts/serve.py --bind 0.0.0.0 --port 4321 --root /app/dist
FROM node:22-alpine AS build
WORKDIR /app
# Native deps (sharp) need libc6-compat on alpine.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# The canonical build targets GitHub Pages under /oem-links/. This service is
# served from the domain ROOT, so override the base or every asset 404s.
ARG SITE_BASE=/
ARG SITE_URL=https://oem-links.mrx.sh
ENV SITE_BASE=$SITE_BASE SITE_URL=$SITE_URL
RUN npm run build && test -f dist/index.html

FROM python:3-alpine AS runtime
WORKDIR /app
# Static files plus the server script only.
COPY --from=build /app/dist /app/dist
COPY scripts/serve.py /app/scripts/serve.py
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD python3 -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:4321/').read()" || exit 1
CMD ["python3", "/app/scripts/serve.py", "--bind", "0.0.0.0", "--port", "4321", "--root", "/app/dist"]
