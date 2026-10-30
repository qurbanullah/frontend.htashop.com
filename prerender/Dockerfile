# HTAShop SPA prerender service
# Headless Chromium renders storefront pages for search-engine crawlers so
# the served HTML contains the full SEO head (meta tags + JSON-LD).
FROM node:20-alpine

# Chromium + shared libraries required for headless rendering on Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libstdc++ \
    && addgroup -S prerender && adduser -S prerender -G prerender \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

EXPOSE 3000

USER prerender

CMD ["node", "server.js"]
