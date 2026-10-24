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

# Copia todo o código fonte do backend
COPY backend/ ./

# Compila explicitamente apontando o arquivo de entrada e a saída exata
# Isso garante que o arquivo final será /app/backend/dist/server.js
RUN npx tsc src/server.ts --outDir dist --target es2022 --module nodenext --moduleResolution nodenext --esModuleInterop

# Copia os arquivos gerados no build do frontend para o diretório correto
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expõe a porta exigida pelo Cloud Run (8080)
EXPOSE 8080
ENV PORT=8080

# Inicia o servidor compilado
WORKDIR /app/backend
CMD ["node", "dist/server.js"]