/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_HOVER: string;
  readonly VITE_SUGGESTION_SESSION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
