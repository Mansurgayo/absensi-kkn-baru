"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // coordinates center Lamkawee Aceh
  const TARGET_LAT = 5.5025285
  const TARGET_LNG = 95.3324727
  const ALLOWED_RADIUS_KM = 0.5
  
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    checkLogin()
  }, [])

  const checkLogin = () => {
    const userId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userId="))
      ?.split("=")[1]
    setIsLoggedIn(!!userId)
  }

  const handleLogout = () => {
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    setIsLoggedIn(false)
    setStatus("Logout berhasil")
    setTimeout(() => {
      router.push("/login")
    }, 500)
  }

  const handleAbsen = async () => {
    setLoading(true)
    setStatus("Mengambil lokasi...")

    if (!navigator.geolocation) {
      setStatus("Browser tidak mendukung GPS ❌")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const distance = haversine(latitude, longitude, TARGET_LAT, TARGET_LNG)
        if (distance > ALLOWED_RADIUS_KM) {
          setStatus("Anda harus berada di Desa Lamkawee untuk absen ❌")
          setLoading(false)
          return
        }

        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: latitude,
            lng: longitude,
          }),
        })

        const data = await res.json()

        if (!res.ok) setStatus(data.error || "Gagal absen ❌")
        else setStatus("Absensi berhasil ✅")

        setLoading(false)
      },
      () => {
        setStatus("GPS tidak diizinkan ❌")
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
      {isLoggedIn && (
        <div className="absolute top-4 right-4 flex gap-2">
          <Link
            href="/my-attendance"
            className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-2 px-4 rounded-lg transition"
          >
            Lihat Absensi
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md text-center">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Absensi Mahasiswa KKN
        </h1>

        <p className="text-gray-500 mb-6">
          Pastikan Anda berada di lokasi KKN
        </p>

        <button
          onClick={handleAbsen}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition 
          ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Memproses..." : "Absen Sekarang"}
        </button>

        {status && (
          <div className="mt-5 text-sm font-medium text-gray-700">
            {status}
          </div>
        )}

        {!isLoggedIn && (
          <div className="mt-6 pt-6 border-t border-gray-300 text-center">
            <p className="text-gray-600 mb-3">Belum punya akun?</p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/login"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
