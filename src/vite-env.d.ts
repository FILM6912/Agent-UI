/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_HOVER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
