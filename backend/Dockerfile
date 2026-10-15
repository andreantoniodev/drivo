FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/src/generated ./src/generated
COPY --chown=node:node package*.json tsconfig.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma

RUN mkdir -p uploads/crlv && chown -R node:node uploads

USER node

EXPOSE 3001

VOLUME ["/app/uploads"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && (npm run prisma:seed || echo '[aviso] seed falhou; iniciando a API mesmo assim') && exec node dist/main.js"]
