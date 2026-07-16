const STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
const API_VERSION = import.meta.env.VITE_SHOPIFY_STOREFRONT_API_VERSION ?? '2025-01'

if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
  console.warn(
    'Missing VITE_SHOPIFY_STORE_DOMAIN or VITE_SHOPIFY_STOREFRONT_TOKEN. ' +
      'Copy .env.example to .env and fill in your Shopify Storefront API credentials.',
  )
}

const ENDPOINT = `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`

interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string }[]
}

export async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Shopify Storefront API request failed: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as GraphQLResponse<T>

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('\n'))
  }

  if (!json.data) {
    throw new Error('Shopify Storefront API returned no data.')
  }

  return json.data
}
