FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY public ./public
COPY src ./src

# Create React App 4 uses webpack 4, which needs the legacy OpenSSL provider
# with current Node.js build images. This setting is build-time only.
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM nginx:1.28-alpine AS runtime

ENV PORT=8080

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1
