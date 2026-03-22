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

// ── state ──────────────────────────────────────────────────────────────────
const currentPath = ref('')
const folders = ref<FolderItem[]>([])
const objects = ref<ObjectItem[]>([])
const loading = ref(false)
const errorMsg = ref('')
const viewMode = ref<'grid' | 'list'>('list')

const isPreviewOpen = ref(false)
const selectedObject = ref<ObjectItem | null>(null)

const isDeleteOpen = ref(false)
const objectToDelete = ref<ObjectItem | null>(null)
const deleting = ref(false)

const isCreateFolderOpen = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const toast = useToast()
const apiBase = useRuntimeConfig().public.apiBase as string
// ── helpers ───────────────────────────────────────────────────────────────
const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes || 0
  let u = 0
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++ }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : '-'

const extensionGroups = {
  image: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico', 'tif', 'tiff']),
  video: new Set(['mp4', 'mkv', 'mov', 'avi', 'webm', 'm4v', 'flv']),
  audio: new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']),
  document: new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']),
  code: new Set(['js', 'ts', 'vue', 'json', 'html', 'css', 'scss', 'md', 'yml', 'yaml', 'py', 'go', 'rs', 'sql']),
  compressed: new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'])
}

const getFileIcon = (name: string) => {
  const ext = name.toLowerCase().split('.').pop() || ''
  if (extensionGroups.image.has(ext)) return 'i-lucide-image'
  if (extensionGroups.video.has(ext)) return 'i-lucide-film'
  if (extensionGroups.audio.has(ext)) return 'i-lucide-music'
  if (extensionGroups.document.has(ext)) return 'i-lucide-file-text'
  if (extensionGroups.code.has(ext)) return 'i-lucide-file-code-2'
  if (extensionGroups.compressed.has(ext)) return 'i-lucide-file-archive'
  return 'i-lucide-file'
}

// ── API ───────────────────────────────────────────────────────────────────
const loadList = async (path = currentPath.value) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<ListResponse>(`${apiBase}/api/r2/list`, {
      method: 'POST',
      body: { path }
    })
    currentPath.value = data.path
    folders.value = data.folders || []
    objects.value = data.objects || []
  }
  catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || e?.message || 'Error al listar R2'
    folders.value = []
    objects.value = []
  }
  finally {
    loading.value = false
  }
}

// ── preview ───────────────────────────────────────────────────────────────
const openPreview = (item: ObjectItem) => {
  selectedObject.value = item
  isPreviewOpen.value = true
}

// ── delete ────────────────────────────────────────────────────────────────
const confirmDelete = (item: ObjectItem) => {
  objectToDelete.value = item
  isDeleteOpen.value = true
}

const executeDelete = async () => {
  if (!objectToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`${apiBase}/api/r2/delete`, {
      method: 'POST',
      body: { key: objectToDelete.value.key }
    })
    toast.add({ title: 'Eliminado', description: objectToDelete.value.name, color: 'success' })
    isDeleteOpen.value = false
    objectToDelete.value = null
    await loadList()
  }
  catch (e: any) {
    toast.add({ title: 'Error al eliminar', description: e?.data?.statusMessage || e?.message, color: 'error' })
  }
  finally {
    deleting.value = false
  }
}

// ── upload ────────────────────────────────────────────────────────────────
const triggerUpload = () => fileInputRef.value?.click()

const onFilesSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  uploading.value = true

  for (const file of files) {
    const key = `${currentPath.value}${file.name}`
    try {
      const { url } = await $fetch<{ url: string }>(`${apiBase}/api/r2/presign`, {
        method: 'POST',
        body: { key, contentType: file.type || 'application/octet-stream' }
      })
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' }
      })
      toast.add({ title: 'Subido', description: file.name, color: 'success' })
    }
    catch (e: any) {
      toast.add({
        title: 'Error al subir',
        description: `${file.name}: ${e?.data?.statusMessage || e?.message || 'Error'}`,
        color: 'error'
      })
    }
  }

  uploading.value = false
  input.value = ''
  await loadList()
}

// ── create folder ─────────────────────────────────────────────────────────
const openCreateFolder = () => {
  newFolderName.value = ''
  isCreateFolderOpen.value = true
}

const executeCreateFolder = async () => {
  const name = newFolderName.value.trim()
  if (!name) return
  creatingFolder.value = true
  try {
    await $fetch(`${apiBase}/api/r2/folder`, {
      method: 'POST',
      body: { path: `${currentPath.value}${name}` }
    })
    toast.add({ title: 'Carpeta creada', description: name, color: 'success' })
    isCreateFolderOpen.value = false
    await loadList()
  }
  catch (e: any) {
    toast.add({
      title: 'Error al crear carpeta',
      description: e?.data?.statusMessage || e?.message,
      color: 'error'
    })
  }
  finally {
    creatingFolder.value = false
  }
}

onMounted(() => loadList(''))
</script>

<template>
  <UContainer class="py-8 space-y-4">
    <!-- Title -->
    <div class="flex items-center gap-3">
      <UIcon name="i-lucide-hard-drive" class="size-6 text-primary shrink-0" />
      <h1 class="text-2xl font-semibold">
        R2 Explorer
      </h1>
    </div>

    <!-- Toolbar -->
    <UCard :ui="{ body: 'p-3' }">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex-1 min-w-0">
          <R2Breadcrumbs :path="currentPath" @navigate="loadList" />
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton size="sm" icon="i-lucide-upload" :loading="uploading" @click="triggerUpload">
            Subir
          </UButton>
          <UButton size="sm" color="neutral" variant="subtle" icon="i-lucide-folder-plus" @click="openCreateFolder">
            Nueva carpeta
          </UButton>
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-refresh-cw" :loading="loading" @click="loadList()" />
          <div class="h-4 w-px bg-default hidden sm:block" />
          <UButton size="sm" color="neutral" :variant="viewMode === 'list' ? 'solid' : 'ghost'" icon="i-lucide-list" @click="viewMode = 'list'" />
          <UButton size="sm" color="neutral" :variant="viewMode === 'grid' ? 'solid' : 'ghost'" icon="i-lucide-layout-grid" @click="viewMode = 'grid'" />
        </div>
      </div>
    </UCard>

    <!-- Content card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">{{ folders.length }} carpetas · {{ objects.length }} objetos</span>
          <UBadge v-if="loading" color="neutral" variant="soft" size="sm">
            Cargando...
          </UBadge>
        </div>
      </template>

      <div v-if="loading && folders.length === 0 && objects.length === 0" class="py-12 text-center text-sm text-muted">
        Cargando...
      </div>

      <div v-else-if="errorMsg" class="py-4 text-sm text-error">
        {{ errorMsg }}
      </div>

      <div v-else-if="folders.length === 0 && objects.length === 0" class="py-14 flex flex-col items-center gap-3 text-muted">
        <UIcon name="i-lucide-folder-open" class="size-12" />
        <p class="text-sm">Carpeta vacía</p>
        <div class="flex gap-2">
          <UButton size="sm" variant="outline" color="neutral" icon="i-lucide-upload" @click="triggerUpload">Subir archivo</UButton>
          <UButton size="sm" variant="outline" color="neutral" icon="i-lucide-folder-plus" @click="openCreateFolder">Nueva carpeta</UButton>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else-if="viewMode === 'list'" class="-mx-4 sm:-mx-6">
        <div class="grid grid-cols-12 px-4 sm:px-6 py-2 text-xs font-medium text-muted border-b border-default">
          <div class="col-span-8 md:col-span-7">Nombre</div>
          <div class="hidden md:block md:col-span-2 text-right">Tamaño</div>
          <div class="hidden md:block md:col-span-2 text-right">Fecha</div>
          <div class="col-span-4 md:col-span-1" />
        </div>

        <!-- Folders -->
        <div
          v-for="folder in folders"
          :key="folder.path"
          class="group grid grid-cols-12 px-4 sm:px-6 py-2.5 items-center transition hover:bg-muted/40 cursor-pointer select-none"
          title="Doble clic para abrir"
          @dblclick="loadList(folder.path)"
        >
          <div class="col-span-8 md:col-span-7 flex items-center gap-2.5 min-w-0">
            <UIcon name="i-lucide-folder" class="size-5 shrink-0 text-amber-500" />
            <span class="truncate text-sm font-medium">{{ folder.name }}</span>
          </div>
          <div class="hidden md:block md:col-span-2 text-xs text-muted text-right">—</div>
          <div class="hidden md:block md:col-span-2 text-xs text-muted text-right">—</div>
          <div class="col-span-4 md:col-span-1 flex justify-end">
            <UButton
              size="xs" color="neutral" variant="ghost" icon="i-lucide-chevron-right"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="loadList(folder.path)"
            />
          </div>
        </div>

        <div v-if="folders.length > 0 && objects.length > 0" class="border-t border-dashed border-default mx-4 sm:mx-6 my-1" />

        <!-- Objects -->
        <div
          v-for="item in objects"
          :key="item.key"
          class="group grid grid-cols-12 px-4 sm:px-6 py-2.5 items-center transition hover:bg-muted/40 cursor-pointer"
          @click="openPreview(item)"
        >
          <div class="col-span-8 md:col-span-7 flex items-center gap-2.5 min-w-0">
            <UIcon :name="getFileIcon(item.name)" class="size-5 shrink-0 text-muted" />
            <span class="truncate text-sm" :title="item.key">{{ item.name }}</span>
          </div>
          <div class="hidden md:block md:col-span-2 text-xs text-muted text-right">{{ formatBytes(item.size) }}</div>
          <div class="hidden md:block md:col-span-2 text-xs text-muted text-right">{{ formatDate(item.uploadedAt) }}</div>
          <div class="col-span-4 md:col-span-1 flex justify-end">
            <UButton
              size="xs" color="error" variant="ghost" icon="i-lucide-trash-2"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="confirmDelete(item)"
            />
          </div>
        </div>
      </div>

      <!-- GRID VIEW -->
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <!-- Folder cards -->
        <div
          v-for="folder in folders"
          :key="folder.path"
          class="group relative flex flex-col items-center justify-center gap-2 rounded-lg border border-default p-6 hover:border-primary hover:bg-muted/20 transition cursor-pointer select-none"
          title="Doble clic para abrir"
          @dblclick="loadList(folder.path)"
        >
          <UIcon name="i-lucide-folder" class="size-10 text-amber-500" />
          <p class="text-sm font-medium truncate w-full text-center">{{ folder.name }}</p>
          <UButton
            size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-right"
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="loadList(folder.path)"
          />
        </div>

        <!-- Object cards -->
        <CardObject
          v-for="item in objects"
          :key="item.key"
          :name="item.name"
          :size="item.size"
          :key-path="item.key"
          :uploaded-at="item.uploadedAt"
          @view="openPreview(item)"
          @delete="confirmDelete(item)"
        />
      </div>
    </UCard>

    <input ref="fileInputRef" type="file" multiple class="hidden" @change="onFilesSelected">

    <ObjectPreviewModal v-model:open="isPreviewOpen" :object="selectedObject" />

    <!-- Delete modal -->
    <UModal
      v-model:open="isDeleteOpen"
      title="Eliminar objeto"
      :description="`¿Deseas eliminar '${objectToDelete?.name}'? Esta acción no se puede deshacer.`"
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="isDeleteOpen = false">Cancelar</UButton>
          <UButton color="error" icon="i-lucide-trash-2" :loading="deleting" @click="executeDelete">Eliminar</UButton>
        </div>
      </template>
    </UModal>

    <!-- Create folder modal -->
    <UModal v-model:open="isCreateFolderOpen" title="Nueva carpeta">
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-muted">
            Se creará en: <span class="font-medium text-default">{{ currentPath || '/' }}</span>
          </p>
          <UInput v-model="newFolderName" placeholder="nombre-de-la-carpeta" autofocus @keyup.enter="executeCreateFolder" />
          <p class="text-xs text-muted">
            Se creará un archivo <code>.keep</code> dentro para simular la carpeta en R2.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="isCreateFolderOpen = false">Cancelar</UButton>
          <UButton icon="i-lucide-folder-plus" :disabled="!newFolderName.trim()" :loading="creatingFolder" @click="executeCreateFolder">
            Crear carpeta
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
