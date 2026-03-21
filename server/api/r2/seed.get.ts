export default defineEventHandler(async (event) => {
  const { R2_BUCKET } = event.context.cloudflare.env;
  await R2_BUCKET.put('test-file.txt', 'Hola desde mi local!');
  return { message: 'Archivo de prueba creado en .wrangler/state' };
})