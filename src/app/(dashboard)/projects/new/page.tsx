import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NewProjectForm } from "@/components/project/new-project-form"

export const dynamic = "force-dynamic"

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
      <NewProjectForm />
    </div>
  )
}