// Minimal typed logger wrapper. Replace internals with a real structured logger later.
export type LogMeta = Record<string, unknown>

const format = (message: string, meta?: LogMeta, err?: unknown) => {
  const parts: unknown[] = [message]
  if (meta && Object.keys(meta).length) parts.push(meta)
  if (err) parts.push(err)
  return parts
}

export const logger = {
  info: (message: string, meta?: LogMeta) => console.info(...format(message, meta)),
  warn: (message: string, meta?: LogMeta) => console.warn(...format(message, meta)),
  error: (message: string, error?: unknown, meta?: LogMeta) => console.error(...format(message, meta, error)),
}

export default logger
