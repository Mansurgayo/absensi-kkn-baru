import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

// coordinates target (Lamkawee Aceh)
const TARGET_LAT = 5.5025285
const TARGET_LNG = 95.3324727
// allowed radius in kilometers
const ALLOWED_RADIUS_KM = 0.5

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371 // earth radius km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value

    if (!userId) {
      return NextResponse.json(
        { error: "Belum login" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lat, lng } = body

    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: "Lokasi tidak valid" },
        { status: 400 }
      )
    }

    // validate distance
    const distance = haversine(lat, lng, TARGET_LAT, TARGET_LNG)
    if (distance > ALLOWED_RADIUS_KM) {
      return NextResponse.json(
        { error: "Anda berada di luar jangkauan lokasi KKN" },
        { status: 403 }
      )
    }

    // simpan ke database
    const att = await prisma.attendance.create({
      data: {
        userId,
        latitude: lat,
        longitude: lng,
      },
    })

    return NextResponse.json(
      { message: "Absensi berhasil", attendance: att },
      { status: 200 }
    )
  } catch (error) {
    console.error("Attendance error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
