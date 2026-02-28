"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AttendanceRecord {
  id: string
  latitude: number
  longitude: number
  createdAt: string
}

export default function MyAttendancePage() {
  const router = useRouter()
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    fetchAttendances()
  }, [])

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/attendance/my-attendance")
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Gagal memuat absensi")
        if (res.status === 401) {
          router.push("/login")
        }
        return
      }

      setAttendances(data.attendances || [])
      setUserName(data.userName || "")
      setLoading(false)
    } catch (err) {
      setError("Kesalahan saat memuat data")
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Memuat absensi Anda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navigation */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Absensi</h1>
          <p className="text-sm text-blue-200">Halo, {userName}!</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold transition"
          >
            Absen
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white font-semibold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">Total Absensi</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{attendances.length}</p>
            </div>
            <div className="text-5xl text-blue-200">📋</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {attendances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Anda belum melakukan absensi</p>
              <Link
                href="/"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Absen Sekarang
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-200 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tanggal & Waktu</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Latitude</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Longitude</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((att, idx) => (
                  <tr key={att.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm text-gray-800">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {new Date(att.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{att.latitude.toFixed(6)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{att.longitude.toFixed(6)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <a
                        href={`https://maps.google.com/?q=${att.latitude},${att.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Lihat Peta 🗺️
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
