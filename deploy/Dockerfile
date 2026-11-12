# syntax=docker/dockerfile:1
# Build context is the repository root: docker build -f deploy/Dockerfile .

FROM node:26-bookworm-slim AS build
WORKDIR /src
COPY shell/package.json shell/package-lock.json shell/
COPY prescription/package.json prescription/package-lock.json prescription/
RUN cd shell && npm ci --no-audit --no-fund && cd ../prescription && npm ci --no-audit --no-fund
COPY shell shell
COPY prescription prescription
RUN cd shell && npm run build && cd ../prescription && npm run build

FROM oven/bun:1.4-alpine
WORKDIR /app
COPY --from=build /src/shell/dist/shell/browser shell
COPY --from=build /src/prescription/dist/prescription/browser remote
COPY deploy/server.ts deploy/edge.ts deploy/hints.ts ./
USER bun
EXPOSE 4200
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD ["bun", "-e", "fetch('http://127.0.0.1:4200/remotes.json').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["bun", "server.ts"]
