# R2 Manager

Gestor de archivos para **Cloudflare R2** construido con [Nuxt 4](https://nuxt.com) y [Nuxt UI](https://ui.nuxt.com). Permite explorar, subir, eliminar y organizar objetos y carpetas en un bucket R2, con soporte para previsualización de imágenes, videos y audio.

## Características

- 📁 Navegación por carpetas con breadcrumbs
- 🖼️ Miniaturas de imágenes mediante Cloudflare Image Resizing
- ▶️ Previsualización de imágenes, videos y audio en modal
- ⬆️ Subida de archivos mediante Presigned URL (PUT directo a R2)
- 🗑️ Eliminación de objetos con confirmación
- 📂 Creación de carpetas (usando archivo `.keep` como placeholder)
- 🔀 Vista en grid o listado
- 🌗 Modo claro / oscuro

## Stack

- **Nuxt 4** + **Nitro** — framework y servidor
- **Nuxt UI v4** + **Tailwind CSS v4** — interfaz
- **Cloudflare Workers** + **R2** — runtime y almacenamiento
- **Wrangler** — desarrollo y despliegue en Cloudflare
- **AWS SDK v3** — generación de presigned URLs para subida

---

## Configuración

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno / Secrets

El proyecto usa las siguientes variables. Nuxt las mapea automáticamente desde el entorno usando el prefijo `NUXT_`.

| Variable Nuxt (`runtimeConfig`) | Variable de entorno / Secret |
|---|---|
| `r2AccountId` | `NUXT_R2_ACCOUNT_ID` |
| `r2AccessKeyId` | `NUXT_R2_ACCESS_KEY_ID` |
| `r2SecretAccessKey` | `NUXT_R2_SECRET_ACCESS_KEY` |
| `r2BucketName` | `NUXT_R2_BUCKET_NAME` |

> Estas credenciales se usan **únicamente** para generar Presigned URLs de subida (AWS SDK). El resto de operaciones usan el binding nativo de R2 en Cloudflare Workers.

#### Para desarrollo local (`.env`)

Crea un archivo `.env` en la raíz:

```env
NUXT_R2_ACCOUNT_ID=tu_account_id
NUXT_R2_ACCESS_KEY_ID=tu_access_key_id
NUXT_R2_SECRET_ACCESS_KEY=tu_secret_access_key
NUXT_R2_BUCKET_NAME=base
```

#### Para producción en Cloudflare Workers

Configura los secrets con Wrangler (solo se hace una vez):

```bash
wrangler secret put NUXT_R2_ACCOUNT_ID
wrangler secret put NUXT_R2_ACCESS_KEY_ID
wrangler secret put NUXT_R2_SECRET_ACCESS_KEY
wrangler secret put NUXT_R2_BUCKET_NAME
```

### 3. Variables públicas (opcionales)

Se pueden sobreescribir mediante variables de entorno:

| Variable | Default | Descripción |
|---|---|---|
| `API_BASE` | `https://r2-manager.paulp.dev` | URL base de la API en producción |
| `R2_PUBLIC_BASE_URL` | `https://r2.paulp.dev` | Dominio público del bucket R2 para servir archivos |

---

## Desarrollo

### Modo Nuxt estándar (sin Workers)

```bash
pnpm dev
```

Levanta el servidor en `http://localhost:3000`. Las llamadas a `/api-remote` se proxean al Worker desplegado en Cloudflare.

### Modo Cloudflare Workers (con Wrangler)

```bash
pnpm dev:cf
```

Requiere haber hecho `wrangler login` previamente. Simula el entorno de Cloudflare Workers con el binding R2 en local.

---

## Despliegue

### Build para Cloudflare Workers

```bash
pnpm build:cf
```

### Desplegar en Cloudflare

```bash
pnpm deploy:cf
```

---

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/r2/list` | Lista objetos y carpetas en un `path` dado |
| `POST` | `/api/r2/presign` | Genera una Presigned URL para subir un archivo |
| `POST` | `/api/r2/delete` | Elimina un objeto por `key` |
| `POST` | `/api/r2/folder` | Crea una carpeta (archivo `.keep` como placeholder) |

---

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
