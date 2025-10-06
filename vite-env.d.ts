/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PEXELS_API_KEY: string
  readonly VITE_USE_V2_CANVAS: string
  readonly VITE_STATE_MACHINE: string
  readonly VITE_NEW_PROPERTIES: string
  readonly VITE_TEXT_EFFECTS: string
  readonly VITE_ADVANCED_TYPOGRAPHY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
/// <reference types="vite-plugin-comlink/client" />
