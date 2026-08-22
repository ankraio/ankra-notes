FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 10001 -S app && adduser -u 10001 -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER 10001
EXPOSE 3000
CMD ["node", "src/server.js"]
