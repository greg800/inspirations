import { createContext, useContext, useState } from 'react'

const GalleryFilterContext = createContext(null)

export function GalleryFilterProvider({ children }) {
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  return (
    <GalleryFilterContext.Provider value={{ filtersVisible, setFiltersVisible, hasActiveFilters, setHasActiveFilters }}>
      {children}
    </GalleryFilterContext.Provider>
  )
}

export function useGalleryFilter() {
  return useContext(GalleryFilterContext)
}
