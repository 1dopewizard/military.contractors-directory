/**
 * Composable for admin dashboard keyboard shortcuts
 */
export function useAdminShortcuts(options: {
  tabs: { id: string; label: string }[]
  activeTab: Ref<string>
  setActiveTab: (tabId: string) => void
  onRefresh?: () => void
  onSearch?: () => void
}) {
  const { tabs, activeTab, setActiveTab, onRefresh, onSearch } = options

  const handleKeydown = (e: KeyboardEvent) => {
    // Ignore if typing in an input
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Cmd/Ctrl + K: Open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      onSearch?.()
      return
    }

    // R: Refresh current tab
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      onRefresh?.()
      return
    }

    // Number keys 1-9: Switch tabs
    const num = parseInt(e.key)
    if (num >= 1 && num <= 9 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tabIndex = num - 1
      const tab = tabs[tabIndex]
      if (tab) {
        e.preventDefault()
        setActiveTab(tab.id)
      }
      return
    }

    // Arrow keys for tab navigation
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const currentIndex = tabs.findIndex(t => t.id === activeTab.value)
      if (currentIndex === -1) return

      e.preventDefault()
      const newIndex = e.key === 'ArrowUp'
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : (currentIndex + 1) % tabs.length
      const newTab = tabs[newIndex]
      if (newTab) setActiveTab(newTab.id)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    shortcuts: [
      { key: '1-9', description: 'Switch tabs' },
      { key: 'R', description: 'Refresh' },
      { key: '⌘K', description: 'Search' },
      { key: '↑↓', description: 'Navigate tabs' },
    ]
  }
}
