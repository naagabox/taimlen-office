"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  LogOut, 
  User,
  DoorOpen,
  DoorClosed,
  Menu,
} from "lucide-react"

interface DashboardNavProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function DashboardNav({ sidebarOpen, onToggleSidebar }: DashboardNavProps) {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
            style={{ marginLeft: "-9px" }}
          >
            {sidebarOpen ? (
              <DoorOpen className="h-5 w-5 text-gray-600" />
            ) : (
              <DoorClosed className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <Link href="/projects" className="text-xl font-bold">
            Timeline Proyek
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {session?.user && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{session.user.name || session.user.email}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}