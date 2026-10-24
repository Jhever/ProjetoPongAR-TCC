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

# Copia todo o código fonte do backend (incluindo a pasta src/ e o tsconfig.json)
COPY backend/ ./

# Compila o TypeScript do backend (o tsc vai ler o tsconfig.json e gerar dist/server.js)
RUN npm run build

# Copia os arquivos gerados no build do frontend para o local esperado pelo servidor
# (Como o backend roda de /app/backend, o caminho para o frontend em /app/frontend/dist fica um nível acima)
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expõe a porta exigida pelo Cloud Run (8080)
EXPOSE 8080
ENV PORT=8080

# Inicia o servidor compilado dentro de /app/backend
WORKDIR /app/backend
CMD ["node", "dist/server.js"]