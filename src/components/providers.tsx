"use client"

import { SessionProvider } from "next-auth/react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}