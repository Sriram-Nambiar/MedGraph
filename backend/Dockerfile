FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY data /app/data
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
