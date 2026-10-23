# Build dependencies on the builder architecture; the gateway has no native npm addons.
FROM --platform=$BUILDPLATFORM node:24.14.0-alpine AS dependencies
WORKDIR /app/apps/gateway
COPY apps/gateway/package.json apps/gateway/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24.14.0-alpine
ENV NODE_ENV=production PORT=3001 AETHERIS_DB_PATH=/data/aetheris.db
WORKDIR /app
COPY --chown=node:node --from=dependencies /app/apps/gateway/node_modules /app/apps/gateway/node_modules
COPY --chown=node:node apps/gateway /app/apps/gateway
COPY --chown=node:node gods-eye-view/src/data/local_data/natural_earth/regions.json /app/gods-eye-view/src/data/local_data/natural_earth/regions.json
COPY --chown=node:node deploy/oci/data/.keep /data/.keep
RUN chown node:node /data
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/gateway/src/server.js"]
