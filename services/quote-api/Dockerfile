FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY services/quote-api ./services/quote-api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @omnifi/quote-api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY --from=builder /app /app

EXPOSE 3001
CMD ["node", "services/quote-api/dist/server.js"]
