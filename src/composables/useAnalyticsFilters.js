import { computed, reactive, ref, watch } from 'vue'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import {
  isHeavyTimeRange,
  rangeDurationMs,
  readSharedTimeRange,
  sharedTimeRanges,
  writeSharedTimeRange,
} from '@/utils/timeRange'

const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString(undefined, { hour12: false })
}

const toIso = (value) => {
  if (!value) return ''
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

export function useAnalyticsFilters(onApply) {
  const servers = ref([])
  const sites = ref([])
  const selectedServer = ref('all')
  const selectedSite = ref('all')
  const selectedTimeRange = ref(readSharedTimeRange())
  const isCustomRange = ref(false)
  const showCustomDialog = ref(false)
  const customStartDate = ref(null)
  const customEndDate = ref(null)
  const applied = reactive({
    server: 'all',
    site: 'all',
    range: selectedTimeRange.value,
    customStart: '',
    customEnd: '',
    appliedAt: Date.now(),
  })

  const serverOptions = computed(() => [
    { label: 'All edges', value: 'all' },
    ...servers.value.map((server) => ({ label: server.name || `Server ${server.id}`, value: String(server.id) })),
  ])

  const siteOptions = computed(() => {
    let list = sites.value
    if (selectedServer.value !== 'all') {
      const serverId = Number(selectedServer.value)
      list = list.filter((site) => Array.isArray(site.serverIds) && site.serverIds.some((id) => Number(id) === serverId))
    }
    return [
      { label: 'All sites', value: 'all' },
      ...list.map((site) => ({ label: site.domain || `Site ${site.id}`, value: String(site.id) })),
    ]
  })

  const rangeLabel = computed(() => {
    if (applied.customStart && applied.customEnd) {
      return `${formatDateTime(applied.customStart)} → ${formatDateTime(applied.customEnd)}`
    }
    return sharedTimeRanges.find((range) => range.value === applied.range)?.label || applied.range
  })

  const showHeavyRangeHint = computed(
    () => !isCustomRange.value && isHeavyTimeRange(selectedTimeRange.value),
  )

  const params = computed(() => {
    const next = { serverId: applied.server, siteId: applied.site }
    if (applied.customStart && applied.customEnd) {
      next.start = applied.customStart
      next.end = applied.customEnd
    } else {
      next.range = applied.range
    }
    return next
  })

  const window = computed(() => {
    if (applied.customStart && applied.customEnd) {
      return { start: new Date(applied.customStart).getTime(), end: new Date(applied.customEnd).getTime() }
    }
    const end = applied.appliedAt
    return { start: end - rangeDurationMs(applied.range), end }
  })

  const apply = () => {
    applied.server = selectedServer.value
    applied.site = selectedSite.value
    applied.range = selectedTimeRange.value
    applied.customStart = isCustomRange.value ? toIso(customStartDate.value) : ''
    applied.customEnd = isCustomRange.value ? toIso(customEndDate.value) : ''
    applied.appliedAt = Date.now()
    onApply?.()
  }

  const selectTimeRange = (value) => {
    selectedTimeRange.value = value
    isCustomRange.value = false
    writeSharedTimeRange(value)
  }

  const applyCustomRange = () => {
    if (!customStartDate.value || !customEndDate.value) return
    isCustomRange.value = true
    showCustomDialog.value = false
    apply()
  }

  const loadScope = async () => {
    const [serverList, siteList] = await Promise.all([
      fetchServers().catch(() => []),
      fetchSites().catch(() => []),
    ])
    servers.value = Array.isArray(serverList) ? serverList : []
    sites.value = Array.isArray(siteList) ? siteList : []
  }

  watch(selectedServer, () => {
    if (selectedSite.value === 'all') return
    if (!siteOptions.value.some((option) => option.value === selectedSite.value)) selectedSite.value = 'all'
  })

  return {
    servers,
    sites,
    selectedServer,
    selectedSite,
    selectedTimeRange,
    isCustomRange,
    showCustomDialog,
    customStartDate,
    customEndDate,
    serverOptions,
    siteOptions,
    timeRanges: sharedTimeRanges,
    rangeLabel,
    showHeavyRangeHint,
    params,
    window,
    apply,
    selectTimeRange,
    applyCustomRange,
    loadScope,
  }
}
