'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface HeaderTitleContextValue {
  overrideTitle: string | null
  setOverrideTitle: (title: string | null) => void
  /** Wrapped in an object to avoid React's function-as-updater ambiguity */
  overrideBack: { fn: () => void } | null
  setOverrideBack: (fn: (() => void) | null) => void
}

const HeaderTitleContext = createContext<HeaderTitleContextValue>({
  overrideTitle: null,
  setOverrideTitle: () => {},
  overrideBack: null,
  setOverrideBack: () => {},
})

export function HeaderTitleProvider({ children }: { children: React.ReactNode }) {
  const [overrideTitle, setOverrideTitle] = useState<string | null>(null)
  const [overrideBack, _setBackObj] = useState<{ fn: () => void } | null>(null)

  const setOverrideBack = useCallback((fn: (() => void) | null) => {
    _setBackObj(fn ? { fn } : null)
  }, [])

  return (
    <HeaderTitleContext.Provider
      value={{ overrideTitle, setOverrideTitle, overrideBack, setOverrideBack }}
    >
      {children}
    </HeaderTitleContext.Provider>
  )
}

export function useHeaderTitle() {
  return useContext(HeaderTitleContext)
}
