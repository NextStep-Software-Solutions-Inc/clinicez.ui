'use client'

import { useEffect } from 'react'

/** Delay before opening the print dialog, to allow the page to fully render */
const PRINT_DIALOG_DELAY_MS = 800

export function PHRAutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, PRINT_DIALOG_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])
  return null
}
