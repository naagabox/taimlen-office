import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function connectDatabase() {
  try {
    await prisma.$connect()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed"
    throw new Error(`Database connection failed: ${message}`)
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error("Failed to disconnect from database:", error)
  }
}