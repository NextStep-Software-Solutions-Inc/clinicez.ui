'use client'

import { useEffect } from 'react'

export function PHRAutoPrint() {
  useEffect(() => {
    // Give the page a moment to fully render before opening the print dialog
    const timer = setTimeout(() => {
      window.print()
    }, 800)
    return () => clearTimeout(timer)
  }, [])
  return null
}
