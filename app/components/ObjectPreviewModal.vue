<script setup lang="ts">
interface ObjectItem {
  key: string
  name: string
  size: number
  etag: string
  uploadedAt: string
}

interface Props {
  object: ObjectItem | null
}

const props = defineProps<Props>()
const open = defineModel<boolean>('open', { default: false })
const config = useRuntimeConfig()

const getExtension = (value: string) => {
  const part = value.toLowerCase().split('.').pop()
  if (!part || part.includes('/'))
    return ''

  return part
}

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico'])
const videoExtensions = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'])
const audioExtensions = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])

const mediaType = computed<'image' | 'video' | 'audio' | 'other'>(() => {
  if (!props.object)
    return 'other'

  const ext = getExtension(props.object.name || props.object.key)
  if (imageExtensions.has(ext))
    return 'image'
  if (videoExtensions.has(ext))
    return 'video'
  if (audioExtensions.has(ext))
    return 'audio'

  return 'other'
})

const buildUrl = (key: string, transform?: string) => {
  const base = String(config.public.r2PublicBaseUrl || 'https://r2.paulp.dev').replace(/\/$/, '')
  const cleanKey = key.replace(/^\/+/, '')
  if (transform)
    return `${base}/cdn-cgi/image/${transform}/${encodeURI(cleanKey)}`

  return `${base}/${encodeURI(cleanKey)}`
}

const objectUrl = computed(() => {
  if (!props.object)
    return ''

  return buildUrl(props.object.key)
})

// Para imágenes: vista modal con ancho máximo adecuado para pantalla y buena calidad
const previewUrl = computed(() => {
  if (!props.object || mediaType.value !== 'image')
    return ''

  return buildUrl(props.object.key, 'width=1200,quality=85,format=auto')
})

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes || 0
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

const formatDate = (value?: string) => {
  if (!value)
    return '-'

  return new Date(value).toLocaleString()
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="props.object?.name"
    :description="props.object?.key"
    :ui="{ description: 'break-all', content: 'max-w-4xl' }"
  >
    <template #body>
      <div v-if="props.object" class="space-y-4">
        <img
          v-if="mediaType === 'image'"
          :src="previewUrl"
          :alt="props.object.name"
          class="max-h-[70vh] w-full rounded-md object-contain bg-black/5"
          loading="lazy"
        >

        <video
          v-else-if="mediaType === 'video'"
          :src="objectUrl"
          controls
          class="max-h-[70vh] w-full rounded-md bg-black"
        />

        <audio
          v-else-if="mediaType === 'audio'"
          :src="objectUrl"
          controls
          class="w-full"
        />

        <div v-else class="space-y-2 text-sm text-muted">
          <p>Este archivo no tiene previsualización embebida.</p>
          <UButton
            :to="objectUrl"
            target="_blank"
            icon="i-lucide-external-link"
            color="neutral"
            variant="outline"
          >
            Abrir archivo
          </UButton>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs text-muted border-t border-default pt-3">
          <p>Tamaño: {{ formatBytes(props.object.size) }}</p>
          <p class="text-right">
            Fecha: {{ formatDate(props.object.uploadedAt) }}
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
