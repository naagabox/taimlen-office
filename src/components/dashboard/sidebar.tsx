"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  FolderKanban, 
  LogOut, 
  User,
} from "lucide-react"

const menuItems = [
  { href: "/projects", icon: FolderKanban, label: "Projects" },
]

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}
      <aside 
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-white transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex h-full w-64 flex-col gap-2 p-4">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-gray-100 text-gray-900" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t pt-4">
            {session?.user && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="truncate">{session.user.name || session.user.email}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-3"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </nav>
      </aside>
    </>
  )
}