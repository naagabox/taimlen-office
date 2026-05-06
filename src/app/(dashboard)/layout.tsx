import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { Providers } from "@/components/providers"

export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main>{children}</main>
      </div>
    </Providers>
  )
}