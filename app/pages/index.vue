<script setup lang="ts">
type FolderItem = {
  path: string
  name: string
}

type ObjectItem = {
  key: string
  name: string
  size: number
  etag: string
  uploadedAt: string
}

type ListResponse = {
  path: string
  folders: FolderItem[]
  objects: ObjectItem[]
}

const pathInput = ref('')
const currentPath = ref('')
const folders = ref<FolderItem[]>([])
const objects = ref<ObjectItem[]>([])
const loading = ref(false)
const errorMsg = ref('')
const viewMode = ref<'grid' | 'list'>('list')

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

const loadList = async (path = pathInput.value) => {
  loading.value = true
  errorMsg.value = ''

  try {
    const data = await $fetch<ListResponse>('/api/r2/list', {
      method: 'POST',
      body: { path }
    })

    currentPath.value = data.path
    pathInput.value = data.path
    folders.value = data.folders || []
    objects.value = data.objects || []
  }
  catch (error: any) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'No se pudo listar R2'
    folders.value = []
    objects.value = []
  }
  finally {
    loading.value = false
  }
}

const openFolder = async (folderPath: string) => {
  await loadList(folderPath)
}

const goToRoot = async () => {
  await loadList('')
}

const goUp = async () => {
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  const parent = parts.length ? `${parts.join('/')}/` : ''
  await loadList(parent)
}

onMounted(() => {
  loadList('')
})
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">
        R2 Explorer
      </h1>
      <p class="text-sm text-muted">
        Lista objetos y carpetas desde /api/r2/list
      </p>
    </div>

    <UCard>
      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          v-model="pathInput"
          type="text"
          placeholder="Path (ej: docs/imagenes)"
          class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2"
          @keyup.enter="loadList()"
        >

        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-search" :loading="loading" @click="loadList()">
            Cargar
          </UButton>
          <UButton color="neutral" variant="subtle" :disabled="loading" @click="goToRoot">
            Raíz
          </UButton>
          <UButton color="neutral" variant="subtle" :disabled="loading || !currentPath" @click="goUp">
            Subir
          </UButton>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-muted">
          Path actual: <span class="font-medium text-highlighted">{{ currentPath || '/' }}</span>
        </p>

        <div class="flex gap-2">
          <UButton
            size="sm"
            color="neutral"
            :variant="viewMode === 'list' ? 'solid' : 'outline'"
            icon="i-lucide-list"
            @click="viewMode = 'list'"
          >
            Lista
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            :variant="viewMode === 'grid' ? 'solid' : 'outline'"
            icon="i-lucide-layout-grid"
            @click="viewMode = 'grid'"
          >
            Grid
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">
            Carpetas
          </h2>
          <UBadge color="neutral" variant="soft">
            {{ folders.length }}
          </UBadge>
        </div>
      </template>

      <div v-if="loading" class="text-sm text-muted">
        Cargando...
      </div>
      <div v-else-if="errorMsg" class="text-sm text-error">
        {{ errorMsg }}
      </div>
      <div v-else-if="folders.length === 0" class="text-sm text-muted">
        Sin carpetas
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <UButton
          v-for="folder in folders"
          :key="folder.path"
          color="neutral"
          variant="subtle"
          icon="i-lucide-folder"
          @click="openFolder(folder.path)"
        >
          {{ folder.name }}
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">
            Objetos
          </h2>
          <UBadge color="neutral" variant="soft">
            {{ objects.length }}
          </UBadge>
        </div>
      </template>

      <div v-if="loading" class="text-sm text-muted">
        Cargando...
      </div>
      <div v-else-if="errorMsg" class="text-sm text-error">
        {{ errorMsg }}
      </div>
      <div v-else-if="objects.length === 0" class="text-sm text-muted">
        Sin objetos
      </div>

      <div v-else-if="viewMode === 'list'" class="divide-y divide-default">
        <div
          v-for="item in objects"
          :key="item.key"
          class="grid grid-cols-12 gap-3 py-3 text-sm"
        >
          <div class="col-span-12 md:col-span-6 font-medium truncate" :title="item.key">
            {{ item.name }}
          </div>
          <div class="col-span-6 md:col-span-2 text-muted">
            {{ formatBytes(item.size) }}
          </div>
          <div class="col-span-6 md:col-span-4 text-muted md:text-right">
            {{ formatDate(item.uploadedAt) }}
          </div>
        </div>
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="item in objects"
          :key="item.key"
          class="h-full"
        >
          <div class="space-y-2 text-sm">
            <p class="font-medium truncate" :title="item.key">
              {{ item.name }}
            </p>
            <p class="text-muted">
              Tamaño: {{ formatBytes(item.size) }}
            </p>
            <p class="text-muted">
              Subido: {{ formatDate(item.uploadedAt) }}
            </p>
            <p class="text-xs text-muted break-all">
              {{ item.key }}
            </p>
          </div>
        </UCard>
      </div>
    </UCard>
  </UContainer>
</template>
