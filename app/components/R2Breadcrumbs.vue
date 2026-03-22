<script setup lang="ts">
const props = defineProps<{ path: string }>()
const emit = defineEmits<{ navigate: [path: string] }>()

const crumbs = computed(() => {
  const parts = props.path.split('/').filter(Boolean)
  const items: { label: string; path: string }[] = [{ label: 'Raíz', path: '' }]
  let cumulative = ''

  for (const part of parts) {
    cumulative += `${part}/`
    items.push({ label: part, path: cumulative })
  }

  return items
})
</script>

<template>
  <nav class="flex flex-wrap items-center gap-0.5 text-sm overflow-x-auto min-w-0">
    <template v-for="(crumb, i) in crumbs" :key="crumb.path">
      <UIcon
        v-if="i === 0"
        name="i-lucide-home"
        class="size-3.5 shrink-0 text-muted"
      />
      <UIcon
        v-else
        name="i-lucide-chevron-right"
        class="size-3.5 shrink-0 text-muted"
      />
      <button
        type="button"
        class="rounded px-1.5 py-0.5 transition-colors whitespace-nowrap"
        :class="i === crumbs.length - 1
          ? 'font-medium text-default cursor-default pointer-events-none'
          : 'text-muted hover:text-default hover:bg-muted/50'"
        @click="emit('navigate', crumb.path)"
      >
        {{ crumb.label }}
      </button>
    </template>
  </nav>
</template>
