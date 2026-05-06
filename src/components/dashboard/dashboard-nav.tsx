"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  FolderKanban, 
  LogOut, 
  User 
} from "lucide-react"

export function DashboardNav() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/projects" className="text-xl font-bold">
            Timeline Proyek
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </Link>
          </nav>
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