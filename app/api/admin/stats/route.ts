import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get stats
    const totalUsers = await prisma.user.count()
    const totalAttendance = await prisma.attendance.count()

    return NextResponse.json({
      totalUsers,
      totalAttendance,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
