# Étape de build
FROM node:lts as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape finale (production)
FROM node:lts-slim

WORKDIR /app

# ffmpeg: used to remux uploaded MP4/MOV with +faststart (see MediaService).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads

ENV NODE_ENV=production

CMD ["node", "dist/main"]

