'use client'

import { NextUIProvider } from "@nextui-org/react"

export function NextUIClientProvider({ children }: { children: React.ReactNode }) {
  return <NextUIProvider>{children}</NextUIProvider>
}
