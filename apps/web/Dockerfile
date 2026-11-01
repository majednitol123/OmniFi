FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY services ./services
COPY chains/solana/package.json ./chains/solana/package.json

RUN pnpm install --frozen-lockfile
RUN pnpm --filter ...@omnifi/web build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9.15.4
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app /app

EXPOSE 3000
CMD ["pnpm", "--filter", "@omnifi/web", "start"]

