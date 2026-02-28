import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 }
      )
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    })
    console.log('[LOGIN] email received:', email)
    console.log('[LOGIN] user found:', Boolean(user), user ? user.id : null)

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      )
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('[LOGIN] password valid:', isPasswordValid)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      )
    }

    const response = NextResponse.json(
      { userId: user.id, role: user.role, message: "Login berhasil" },
      { status: 200 }
    )

    // Set cookie userId
    response.cookies.set("userId", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
