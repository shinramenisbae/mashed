# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
COPY shared/ /app/shared/
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY shared/ /app/shared/
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Copy server production deps
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy built server
COPY --from=server-build /app/server/dist ./dist

# Copy built client
COPY --from=client-build /app/client/dist ./client/dist

# Copy shared types
COPY shared/ ./shared/

# Create uploads directory
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_DIST_PATH=/app/client/dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
