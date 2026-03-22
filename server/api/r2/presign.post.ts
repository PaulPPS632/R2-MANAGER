import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ key: string; contentType?: string }>(event)

  if (!body?.key) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required field: key' })
  }

  const config = useRuntimeConfig(event)
  const accountId = String(config.r2AccountId || '')
  const accessKeyId = String(config.r2AccessKeyId || '')
  const secretAccessKey = String(config.r2SecretAccessKey || '')
  const bucketName = String(config.r2BucketName || '')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing R2 S3 credentials. Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME.'
    })
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  })

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: body.key,
      ContentType: body.contentType || 'application/octet-stream'
    }),
    { expiresIn: 300 }
  )

  return { url, key: body.key }
})
