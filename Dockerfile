# Stage 1: Build & Dependency Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Stage 2: Minimal Runtime Stage
FROM node:18-alpine AS runner

WORKDIR /app

# DevSecOps Best Practice: Create and run as a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies and application code from builder stage
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup server.js ./

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Docker Healthcheck to continuously monitor container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]