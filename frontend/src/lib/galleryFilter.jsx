import { createContext, useContext, useState } from 'react'

const GalleryFilterContext = createContext(null)

const EMPTY_FILTERS = { support: '', genre: '', minRating: '', contributor: '' }

export function GalleryFilterProvider({ children }) {
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState('recent') // 'recent' | 'score'
  const [search, setSearch] = useState('')

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return (
    <GalleryFilterContext.Provider value={{
      filtersVisible, setFiltersVisible,
      hasActiveFilters, setHasActiveFilters,
      filters, setFilter, resetFilters,
      sort, setSort,
      search, setSearch,
    }}>
      {children}
    </GalleryFilterContext.Provider>
  )
}

export function useGalleryFilter() {
  return useContext(GalleryFilterContext)
}
