import { prisma } from "@/lib/db"

export interface DbHealthCheckResult {
  connected: boolean
  error?: string
}

export async function checkDatabaseConnection(): Promise<DbHealthCheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { connected: false, error: errorMessage }
  }
}