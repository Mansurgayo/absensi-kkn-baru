import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, universitas, nim, password } = body

    // Validasi input
    if (!name || !email || !universitas || !nim || !password) {
      return NextResponse.json(
        { error: "Nama, email, universitas, NIM, dan password harus diisi" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Cek email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        universitas,
        nim,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil",
        userId: newUser.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat pendaftaran" },
      { status: 500 }
    )
  }
}
