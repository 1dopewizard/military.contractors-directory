/**
 * @file Shared admin utilities for featured listings/employers
 * @description Common utilities for pagination, selection, and confirm dialogs
 */

export interface ConfirmDialogState {
  open: boolean
  title: string
  description: string
  action: () => Promise<void>
  loading: boolean
}

/**
 * Composable for common admin table functionality
 */
export function useFeaturedAdmin<T extends { id: string }>(_options?: {
  tableName?: string
  itemLabel?: string
}) {

  // Pagination
  const currentPage = ref(1)
  const pageSize = ref(20)

  const resetPage = () => {
    currentPage.value = 1
  }

  const paginate = <T>(items: T[]): { paginatedItems: T[]; totalPages: number } => {
    const totalPages = Math.ceil(items.length / pageSize.value)
    const start = (currentPage.value - 1) * pageSize.value
    const paginatedItems = items.slice(start, start + pageSize.value)
    return { paginatedItems, totalPages }
  }

  // Selection
  const selectedIds = ref<Set<string>>(new Set())
  
  const isSelected = (id: string) => selectedIds.value.has(id)
  
  const toggleSelection = (id: string) => {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    selectedIds.value = new Set(selectedIds.value)
  }
  
  const selectAll = (items: T[]) => {
    if (selectedIds.value.size === items.length) {
      selectedIds.value = new Set()
    } else {
      selectedIds.value = new Set(items.map(i => i.id))
    }
  }
  
  const clearSelection = () => {
    selectedIds.value = new Set()
  }

  // Confirm dialog
  const confirmDialog = ref<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
    action: async () => {},
    loading: false
  })

  const openConfirmDialog = (title: string, description: string, action: () => Promise<void>) => {
    confirmDialog.value = { open: true, title, description, action, loading: false }
  }

  const handleConfirm = async () => {
    confirmDialog.value.loading = true
    await confirmDialog.value.action()
    confirmDialog.value.loading = false
    confirmDialog.value.open = false
  }

  // Loading states
  const actionLoadingId = ref<string | null>(null)
  const bulkLoading = ref(false)
  const isActionLoading = (id: string) => actionLoadingId.value === id

  // Status helpers
  type Status = 'active' | 'scheduled' | 'expired'
  
  const getStatus = (starts_at: string, ends_at: string): Status => {
    const now = new Date()
    const start = new Date(starts_at)
    const end = new Date(ends_at)
    
    if (now < start) return 'scheduled'
    if (now > end) return 'expired'
    return 'active'
  }

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'bg-green-500/10 text-green-600 dark:text-green-400' }
      case 'scheduled':
        return { label: 'Scheduled', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
      case 'expired':
        return { label: 'Expired', class: 'bg-muted text-muted-foreground' }
    }
  }

  // Format helpers
  const calculateCTR = (impressions: number, clicks: number): string => {
    if (impressions === 0) return '0%'
    return `${((clicks / impressions) * 100).toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return {
    // Pagination
    currentPage,
    pageSize,
    resetPage,
    paginate,
    
    // Selection
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    
    // Confirm dialog
    confirmDialog,
    openConfirmDialog,
    handleConfirm,
    
    // Loading
    actionLoadingId,
    bulkLoading,
    isActionLoading,
    
    // Helpers
    getStatus,
    getStatusBadge,
    calculateCTR,
    formatDate
  }
}
