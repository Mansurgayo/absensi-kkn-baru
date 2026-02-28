import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// middleware ini dipanggil pada hampir semua permintaan
// kita ingin memastikan pengguna login sebelum mengakses halaman
// selain beberapa jalur publik seperti /login, /register, dll.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userId = request.cookies.get("userId")

  // daftar prefix yang boleh diakses tanpa login
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/api", // API dibuka untuk pengecekan server
    "/_next", // assets internal
    "/favicon.ico",
  ]

  // jika pathname cocok dengan salah satu publik, maka lewati
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!userId && !isPublic) {
    // belum login, arahkan ke halaman login
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// matcher default sudah mencakup semua, tapi kita bisa mengecualikan file _next
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
