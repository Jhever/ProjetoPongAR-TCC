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
# ETAPA 2: Servidor de Produção
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Copia e instala as dependências do backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Instala globalmente o tsx para rodar o arquivo .ts diretamente sem precisar de compilação prévia
RUN npm install -g tsx

# Copia todo o código fonte do backend
COPY backend/ ./

# COPIA O BUILD DO FRONTEND DIRETAMENTE PARA A PASTA PUBLIC DO BACKEND
COPY --from=frontend-build /app/frontend/dist /app/backend/public

# Expõe a porta exigida pelo Cloud Run (8080)
EXPOSE 8080
ENV PORT=8080

# Roda o servidor TypeScript diretamente com o tsx (evita qualquer problema com dist/ ou exports)
WORKDIR /app/backend
CMD ["npx", "tsx", "src/server.ts"]