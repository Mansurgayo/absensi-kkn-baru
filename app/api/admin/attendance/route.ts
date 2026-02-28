import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

// shared helper to verify admin
async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const forbidden = await requireAdmin(request)
  if (forbidden) return forbidden

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    let where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate + "T00:00:00Z")
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + "T23:59:59Z")
      }
    }

    // Add search filter
    if (search) {
      const searchLower = search.toLowerCase()
      where.OR = [
        { user: { name: { contains: searchLower } } },
        { user: { email: { contains: searchLower } } },
        { user: { universitas: { contains: searchLower } } },
        { user: { nim: { contains: searchLower } } },
      ]
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            universitas: true,
            nim: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedAttendances = attendances.map((att) => ({
      id: att.id,
      userId: att.userId,
      userName: att.user.name,
      userEmail: att.user.email,
      universitas: att.user.universitas || "-",
      nim: att.user.nim || "-",
      latitude: att.latitude,
      longitude: att.longitude,
      createdAt: att.createdAt,
    }))

    return NextResponse.json(formattedAttendances)
  } catch (error) {
    console.error("Attendance error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdmin(request)
  if (forbidden) return forbidden

  try {
    const { userId, latitude, longitude } = await request.json()
    if (!userId || latitude == null || longitude == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    const attendance = await prisma.attendance.create({
      data: { userId, latitude, longitude },
    })
    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Attendance POST error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const forbidden = await requireAdmin(request)
  if (forbidden) return forbidden

  try {
    const { id, latitude, longitude } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }
    const updated = await prisma.attendance.update({
      where: { id },
      data: { latitude, longitude },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Attendance PUT error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const forbidden = await requireAdmin(request)
  if (forbidden) return forbidden

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }
    await prisma.attendance.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Attendance DELETE error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
