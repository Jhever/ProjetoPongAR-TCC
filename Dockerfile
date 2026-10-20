# ==========================================
# ETAPA 1: Constrói o Frontend (React/Vite)
# ==========================================
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Ajuste 'npm run build' se o seu build usar outro script (ex: vite build)
RUN npm run build

# ==========================================
# ETAPA 2: Constrói o Backend e junta tudo
# ==========================================
FROM node:18-alpine
WORKDIR /app

# Copia e instala as dependências do backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./

# Se o seu backend usa TypeScript, gera a compilação dele
RUN npm run build || true

# Copia os arquivos gerados no build do frontend para dentro da pasta pública do backend
# (Certifique-se de que o seu server.ts serve arquivos estáticos dessa pasta, ex: app.use(express.static(path.join(__dirname, '../frontend/dist'))))
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expõe a porta exigida pelo Cloud Run (8080)
EXPOSE 8080
ENV PORT=8080

# Inicia o servidor principal
WORKDIR /app/backend
CMD ["node", "dist/server.js"]