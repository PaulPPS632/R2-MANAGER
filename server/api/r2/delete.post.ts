export default defineEventHandler(async (event) => {
  const body = await readBody<{ key: string }>(event)

  if (!body?.key) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required field: key' })
  }

  const r2 = (event.context as any)?.cloudflare?.env?.R2_BUCKET
  if (!r2 || typeof r2.delete !== 'function') {
    throw createError({ statusCode: 500, statusMessage: 'R2 binding not found.' })
  }

  await r2.delete(body.key)

  return { success: true, key: body.key }
})
