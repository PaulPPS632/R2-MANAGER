const normalizePath = (input?: string) => {
  const cleaned = (input || '').trim().replace(/^\/+/, '')
  if (!cleaned) return ''
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`
}

const getLastSegment = (value: string) => value.split('/').filter(Boolean).pop() || value

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })

  if (event.method === 'OPTIONS') return 'OK'

  const body = await readBody<{ path?: string }>(event)
  const prefix = normalizePath(body?.path)

  // Usamos 'any' aquí para evitar conflictos de tipos con el contexto de Cloudflare
  const r2Binding = (event.context as any)?.cloudflare?.env?.R2_BUCKET

  if (!r2Binding || typeof r2Binding.list !== 'function') {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 binding not found.'
    })
  }

  const listed = await r2Binding.list({
    prefix,
    delimiter: '/'
  })

  const folders = (listed.delimitedPrefixes || [])
    .map((folderPrefix: string) => ({
      path: folderPrefix,
      name: getLastSegment(folderPrefix)
    }))

  const objects = (listed.objects || [])
    .filter((item: any) => item.key && item.key !== prefix)
    .map((item: any) => ({
      key: item.key,
      name: getLastSegment(item.key),
      size: item.size,
      etag: item.etag,
      uploadedAt: item.uploaded,
      // Accedemos a httpMetadata usando el casting de 'any' que pusimos arriba
      contentType: item.httpMetadata?.contentType || 'application/octet-stream'
    }))

  return {
    path: prefix,
    folders,
    objects
  }
})