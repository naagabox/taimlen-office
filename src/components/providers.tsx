"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      disableTransitionOnChange
      storageKey="theme"
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  )
}