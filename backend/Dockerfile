# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and install ALL deps (need ts-node for seed)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy frontend statically served by NestJS
COPY frontend/ ./frontend
    # No frontend statically served anymore
EXPOSE 3000

# Use prisma db seed which reads the prisma.seed config from package.json
CMD ["sh", "-c", "npx prisma migrate deploy || true ; npx prisma db seed || true ; node dist/khoi-dong"]
