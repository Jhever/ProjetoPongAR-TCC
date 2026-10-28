/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Se você tiver outras variáveis no .env, coloque elas aqui também
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}