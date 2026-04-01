/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Set to `"true"` to use built-in practice routes (no Flask needed). */
  readonly VITE_USE_MOCK_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
