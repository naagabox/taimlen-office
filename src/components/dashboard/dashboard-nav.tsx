"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { 
  DoorOpen,
  DoorClosed,
  Sun,
  Moon,
} from "lucide-react"
import { UserAvatarIcon } from "@/components/icons/UserAvatarIcon"

interface DashboardNavProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function DashboardNav({ sidebarOpen, onToggleSidebar }: DashboardNavProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ marginLeft: "-9px" }}
          >
            {sidebarOpen ? (
              <DoorOpen className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <DoorClosed className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <Link href="/projects" className="text-xl font-bold text-gray-900 dark:text-white">
            Timeline Proyek
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-gray-600 dark:text-gray-300"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {session?.user && (
            <div className="flex items-center gap-2">
              <UserAvatarIcon 
                src={session.user.image} 
                className="h-5 w-5" 
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}