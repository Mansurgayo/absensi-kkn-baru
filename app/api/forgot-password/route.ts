import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email harus diisi" },
        { status: 400 }
      )
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Jangan reveal apakah email terdaftar atau tidak (security best practice)
      // Tapi untuk demo, kita beri tahu
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 404 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // Expired dalam 1 jam

    // Simpan token ke database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // TODO: Di production, kirim email dengan link reset menggunakan service seperti SendGrid, Nodemailer, dll
    // Untuk sekarang, log token ke console
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`
    
    console.log("PASSWORD RESET LINK:", resetLink)
    console.log("Token:", resetToken)
    console.log("User:", user.email)

    return NextResponse.json(
      { message: "Reset link telah dikirim ke email Anda" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}