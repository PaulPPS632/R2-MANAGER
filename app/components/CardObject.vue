<script setup lang="ts">
// Definimos lo que recibe el componente
interface Props {
  name: string
  size?: number
  contentType?: string // El mimetype que viene de R2
  keyPath: string
  uploadedAt?: string
}

const props = defineProps<Props>()

// Definimos el evento que enviaremos al padre al hacer clic
const emit = defineEmits(['view'])

// Función para determinar el icono según el mimetype
const getIcon = computed(() => {
  const mime = props.contentType?.toLowerCase() || ''
  
  if (mime.startsWith('image/')) return 'i-heroicons-photo'
  if (mime.startsWith('video/')) return 'i-heroicons-video-camera'
  if (mime.startsWith('text/')) return 'i-heroicons-document-text'
  if (mime === 'application/pdf') return 'i-heroicons-document-chart-bar'
  if (mime.includes('zip') || mime.includes('rar')) return 'i-heroicons-archive-box'
  
  return 'i-heroicons-document' // Icono por defecto
})

// Función para formatear el tamaño (opcional pero recomendado)
const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
    <UCard class="hover:ring-2 hover:ring-primary-500 cursor-pointer transition-all p-4"
        @click="emit('view', props)">
        <div class="flex items-center gap-3">
            <p>ga</p>
            <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <UIcon :name="getIcon" class="w-8 h-8 text-primary-500" />
            </div>

            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate text-gray-900 dark:text-white">
                    {{ name }}
                </p>
                <p class="text-xs text-gray-500">
                    {{ formatSize(size) }}
                </p>
            </div>
        </div>
    </UCard>
</template>