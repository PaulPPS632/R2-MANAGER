export default defineEventHandler(async (event) => {
  const body = await readBody<{ path: string }>(event)

  if (!body?.path) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required field: path' })
  }

  const r2 = (event.context as any)?.cloudflare?.env?.R2_BUCKET
  if (!r2 || typeof r2.put !== 'function') {
    throw createError({ statusCode: 500, statusMessage: 'R2 binding not found.' })
  }

  const basePath = body.path.replace(/^\/+/, '').replace(/\/+$/, '')

  if (!basePath) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid folder path' })
  }

  // Cloudflare R2 has no native folder concept.
  // We simulate one by creating an empty placeholder file inside the path.
  const mockKey = `${basePath}/.keep`

  await r2.put(mockKey, new Uint8Array(0), {
    httpMetadata: { contentType: 'text/plain' }
  })

  return { success: true, path: `${basePath}/` }
})
