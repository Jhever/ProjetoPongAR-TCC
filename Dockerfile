# ETAPA 1
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ETAPA 2
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./
RUN npm run build || true
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
EXPOSE 8080
ENV PORT=8080
WORKDIR /app/backend
CMD ["node", "dist/server.js"]