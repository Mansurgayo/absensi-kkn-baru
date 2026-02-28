"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    universitas: "",
    nim: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validasi
    if (!formData.name || !formData.email || !formData.universitas || !formData.nim || !formData.password) {
      setError("Semua field harus diisi")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          universitas: formData.universitas,
          nim: formData.nim,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal")
        setLoading(false)
        return
      }

      setSuccess("Berhasil mendaftar! Sedang dialihkan ke login...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      setError("Terjadi kesalahan saat pendaftaran")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Daftar
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Buat akun baru untuk Sistem Absensi KKN
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Masukkan email Anda"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nama Universitas
            </label>
            <input
              type="text"
              name="universitas"
              required
              value={formData.universitas}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Masukkan nama universitas Anda"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              NIM
            </label>
            <input
              type="text"
              name="nim"
              required
              value={formData.nim}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Masukkan NIM Anda"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Konfirmasi Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              placeholder="Ulangi password Anda"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? "Sedang mendaftar..." : "Daftar"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
