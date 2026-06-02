FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

RUN apk add --no-cache tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin tesseract-ocr-ben leptonica-dev

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
