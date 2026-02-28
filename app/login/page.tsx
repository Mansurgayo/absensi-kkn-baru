"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login gagal")
        setLoading(false)
        return
      }

      // Simpan userId di cookie (via API)
      document.cookie = `userId=${data.userId}; path=/`
      
      // Redirect berdasarkan role
      if (data.role === "ADMIN") {
        router.push("/admin/dashboard")
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Login
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Masuk ke Sistem Absensi KKN
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Masukkan email Anda"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Masukkan password Anda"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? "Sedang login..." : "Login"}
          </button>
        </form>

        <div className="flex flex-col gap-3 mt-6">
          <p className="text-center text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Daftar di sini
            </Link>
          </p>
          <p className="text-center text-gray-600">
            Lupa password?{" "}
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold">
              Reset password
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
