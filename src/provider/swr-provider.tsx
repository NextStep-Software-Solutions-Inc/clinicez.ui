'use client';
import { SWRConfig } from 'swr'

export const SWRProvider = ({ children }: {
    children: React.ReactNode;
}) => {
  return (
    <SWRConfig value={{
      // dedupingInterval: 1000 * 10,
    }}>
      {children}
    </SWRConfig>
  )
};