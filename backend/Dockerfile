# Dockerfile para Railway/Render
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências primeiro (cache layer)
COPY backend/package*.json ./
COPY backend/prisma ./prisma

# Instalar dependências
RUN npm ci --only=production

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]

