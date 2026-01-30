interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_EVENT_STREAM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
