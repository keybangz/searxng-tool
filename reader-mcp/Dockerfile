FROM node:22-alpine

RUN addgroup -S reader && adduser -S reader -G reader

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/ ./src/

USER reader

CMD ["node", "src/index.js"]
