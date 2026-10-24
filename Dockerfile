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

# Compila o TypeScript forçando estritamente o módulo ESNext/NodeNext (evita o erro de exports)
RUN npx tsc src/server.ts --outDir dist --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop true

# Copia os arquivos gerados no build do frontend para o local correto (subindo dois níveis a partir de backend/dist)
COPY --from=frontend-build /app/frontend/dist /app/frontend/frontend/dist

# Expõe a porta exigida pelo Cloud Run (8080)
EXPOSE 8080
ENV PORT=8080

# Inicia o servidor compilado
WORKDIR /app/backend
CMD ["node", "dist/server.js"]