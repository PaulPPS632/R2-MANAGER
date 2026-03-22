<script setup lang="ts">
interface Props {
  name: string
  size?: number
  keyPath: string
  uploadedAt?: string
}

const props = defineProps<Props>()
const config = useRuntimeConfig()

const emit = defineEmits<{
  view: []
  delete: []
}>()

const extensionGroups = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico', 'tif', 'tiff'],
    video: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'm4v', 'flv'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
    code: ['js', 'ts', 'vue', 'json', 'html', 'css', 'scss', 'md', 'yml', 'yaml', 'xml', 'py', 'java', 'go', 'rs', 'sql'],
    compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz']
}

const extension = computed(() => {
    const source = (props.name || props.keyPath || '').toLowerCase()
    const parts = source.split('.')

    if (parts.length < 2)
        return ''

    return parts.pop() || ''
})

const getIcon = computed(() => {
    const ext = extension.value

    if (extensionGroups.image.includes(ext)) return 'i-lucide-image'
    if (extensionGroups.video.includes(ext)) return 'i-lucide-film'
    if (extensionGroups.audio.includes(ext)) return 'i-lucide-music'
    if (extensionGroups.document.includes(ext)) return 'i-lucide-file-text'
    if (extensionGroups.code.includes(ext)) return 'i-lucide-file-code-2'
    if (extensionGroups.compressed.includes(ext)) return 'i-lucide-file-archive'

    return 'i-lucide-file'
})

const isImage = computed(() => extensionGroups.image.includes(extension.value))

// Thumbnail vía Cloudflare Image Resizing: 400×280, calidad 70, recorte cover
const thumbnailUrl = computed(() => {
  if (!isImage.value)
    return ''

  const base = String(config.public.r2PublicBaseUrl || 'https://r2.paulp.dev').replace(/\/$/, '')
  const key = (props.keyPath || '').replace(/^\/+/, '')
  return `${base}/cdn-cgi/image/width=400,height=280,quality=70,format=auto,fit=cover/${encodeURI(key)}`
})

const formatSize = (bytes?: number) => {
    if (!bytes)
        return '0 B'

  const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

</script>

<template>
  <UCard
    class="group relative cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
    :ui="{ body: 'p-0' }"
    @click="emit('view')"
  >
    <!-- Delete button overlay -->
    <UButton
      size="xs"
      color="error"
      variant="solid"
      icon="i-lucide-trash-2"
      class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop="emit('delete')"
    />
    <!-- Thumbnail para imágenes -->
    <div v-if="isImage" class="h-36 w-full overflow-hidden bg-muted">
      <img
        :src="thumbnailUrl"
        :alt="name"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      >
    </div>

    <!-- Icono para no-imágenes -->
    <div v-else class="flex h-36 w-full items-center justify-center bg-muted">
      <UIcon :name="getIcon" class="h-12 w-12 text-muted" />
    </div>

    <!-- Info -->
    <div class="flex items-center gap-2 p-3">
      <UIcon :name="getIcon" class="h-4 w-4 shrink-0 text-muted" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">
          {{ name }}
        </p>
        <p class="text-xs text-muted">
          {{ formatSize(size) }}
        </p>
      </div>
    </div>
  </UCard>
</template>