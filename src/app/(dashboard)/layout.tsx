"use client"

import { useState, useEffect } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Providers } from "@/components/providers"

export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_open")
      if (saved === "true") setSidebarOpen(true)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem("sidebar_open", String(sidebarOpen)) }
    catch {}
  }, [sidebarOpen])

  return (
    <Providers>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main 
          className={`pt-0 transition-all duration-200 ${sidebarOpen ? "md:ml-64" : "md:ml-0"}`}
        >
          <div className="p-0">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  )
}