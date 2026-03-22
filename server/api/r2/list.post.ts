const normalizePath = (input?: string) => {
  const cleaned = (input || '').trim().replace(/^\/+/, '')
  if (!cleaned)
    return ''

  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`
}

const getLastSegment = (value: string) => value.split('/').filter(Boolean).pop() || value

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*', // O 'http://localhost:3000'
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  if (event.method === 'OPTIONS') return 'OK'
  const body = await readBody<{ path?: string }>(event)
  const prefix = normalizePath(body?.path)

  // Workers binding mode (Cloudflare + Wrangler)
  const r2Binding = (event.context as any)?.cloudflare?.env?.R2_BUCKET as any

  if (!r2Binding || typeof r2Binding.list !== 'function') {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 binding not found. Run with Wrangler and configure R2_BUCKET in wrangler.toml.'
    })
  }

  const listed = await r2Binding.list({
    prefix,
    delimiter: '/'
  })

  const folders = ((listed.delimitedPrefixes || []) as string[])
    .map(folderPrefix => ({
      path: folderPrefix,
      name: getLastSegment(folderPrefix)
    }))

  const objects = ((listed.objects || []) as Array<{
    key: string
    size: number
    etag: string
    uploaded: string
  }>)
    .filter(item => item.key && item.key !== prefix)
    .map(item => ({
      key: item.key,
      name: getLastSegment(item.key),
      size: item.size,
      etag: item.etag,
      uploadedAt: item.uploaded
    }))

  return {
    path: prefix,
    folders,
    objects
  }
})
