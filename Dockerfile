# ==========================================
# ETAPA 1: Constrói o Frontend (React/Vite)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Constrói o Backend e junta tudo
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Copia e instala as dependências do backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./

# Compila o backend TypeScript para JavaScript (se houver script de build)
RUN npm run build || true

# Copia os arquivos gerados no build do frontend para a pasta pública do backend
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expõe a porta exigida pelo Cloud Run (8080)
EXPOSE 8080
ENV PORT=8080

# Inicia o servidor principal
WORKDIR /app/backend
CMD ["node", "dist/server.js"]