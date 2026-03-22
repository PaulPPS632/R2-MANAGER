export default defineEventHandler(async (event) => {
  const key = getQuery(event).key

  if (!key || typeof key !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query param: key'
    })
  }

  const r2Binding = (event.context as any)?.cloudflare?.env?.R2_BUCKET as any

  if (!r2Binding || typeof r2Binding.get !== 'function') {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 binding not found. Run with Wrangler and configure R2_BUCKET in wrangler.toml.'
    })
  }

  const object = await r2Binding.get(key)

  if (!object) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Object not found'
    })
  }

  const contentType = object.httpMetadata?.contentType || 'application/octet-stream'

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=300')

  if (object.etag) {
    setHeader(event, 'ETag', object.etag)
  }

  if (object.uploaded) {
    setHeader(event, 'Last-Modified', new Date(object.uploaded).toUTCString())
  }

  return object.body
})
