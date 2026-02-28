import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value

    if (!userId) {
      return NextResponse.json(
        { error: "Belum login" },
        { status: 401 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Get user's attendance records
    const attendances = await prisma.attendance.findMany({
      where: { userId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      userName: user.name,
      attendances,
    })
  } catch (error) {
    console.error("My Attendance error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
