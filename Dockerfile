# Frontend Dockerfile for HTAShop Manage
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies exclusively from lockfile (reproducible, faster)
RUN npm ci

# Copy source code
COPY . .

# Ensure .env.production exists and has required variables
RUN if [ ! -f .env.production ]; then \
        echo "ERROR: .env.production file not found!" && exit 1; \
    fi && \
    if ! grep -q "VITE_API_URL" .env.production; then \
        echo "ERROR: VITE_API_URL not found in .env.production!" && exit 1; \
    fi

# Build the application (Vite will use .env.production automatically)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy static nginx configuration directly (not a template)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp

# Set permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Add healthcheck (targets the internal port 23050)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:23050/health || exit 1

# Expose internal port for manage
EXPOSE 23050

# Start nginx directly (no entrypoint needed — CSP nonce is static)
CMD ["nginx", "-g", "daemon off;"]
