# Multi-stage Dockerfile for CoinNova Trading Platform

###############################################################################
# Stage 1: Build Client
###############################################################################
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy client source
COPY client/ ./

# Build client application
ARG NODE_ENV=production
ARG REACT_APP_API_URL
ARG REACT_APP_COINGECKO_API_URL=https://api.coingecko.com/api/v3

ENV NODE_ENV=${NODE_ENV}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_COINGECKO_API_URL=${REACT_APP_COINGECKO_API_URL}

RUN npm run build

###############################################################################
# Stage 2: Build Server
###############################################################################
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source
COPY server/ ./

###############################################################################
# Stage 3: Production Image
###############################################################################
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy server files
COPY --from=server-builder --chown=nodejs:nodejs /app/server ./server

# Copy client build
COPY --from=client-builder --chown=nodejs:nodejs /app/client/build ./client/build

# Copy database schema
COPY --chown=nodejs:nodejs database/schema.sql ./database/

# Create necessary directories
RUN mkdir -p logs database/backups && \
    chown -R nodejs:nodejs logs database

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server/index.js"]
