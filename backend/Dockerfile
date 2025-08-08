#development stage
FROM node:22-bookworm-slim as development

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "dev:docker"]

#Production stage
FROM node:22-bookworm-slim as production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=development /app/dist ./dist

CMD ["node", "dist/index.js"]
