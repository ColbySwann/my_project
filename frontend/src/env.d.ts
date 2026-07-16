interface ImportMetaEnv {
  readonly VITE_SHOPIFY_STORE_DOMAIN: string
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN: string
  readonly VITE_SHOPIFY_STOREFRONT_API_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
