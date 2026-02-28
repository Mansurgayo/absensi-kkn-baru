"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// PDF will be generated on the server by Express + PDFKit

interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  userEmail: string
  universitas: string
  nim: string
  latitude: number
  longitude: number
  createdAt: string
}

interface Stats {
  totalUsers: number
  totalAttendance: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAttendance: 0 })
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    checkAdminAccess()
    fetchData()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/verify")
      if (!response.ok) {
        router.push("/login")
      }
    } catch (err) {
      router.push("/login")
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const statsRes = await fetch("/api/admin/stats")
      const statsData = await statsRes.json()
      setStats(statsData)

      const attendanceRes = await fetch("/api/admin/attendance")
      const attendanceData = await attendanceRes.json()
      setAttendances(Array.isArray(attendanceData) ? attendanceData : [])
      setLoading(false)
    } catch (err) {
      setError("Gagal memuat data")
      setLoading(false)
    }
  }

  // CRUD handlers
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return
    try {
      const res = await fetch(`/api/admin/attendance?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
      else alert("Gagal menghapus")
    } catch {
      alert("Terjadi kesalahan saat menghapus")
    }
  }

  const handleEdit = async (att: AttendanceRecord) => {
    const lat = prompt("Masukkan latitude:", att.latitude.toString())
    const lng = prompt("Masukkan longitude:", att.longitude.toString())
    if (lat == null || lng == null) return
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: att.id, latitude: parseFloat(lat), longitude: parseFloat(lng) }),
      })
      if (res.ok) fetchData()
      else alert("Gagal memperbarui")
    } catch {
      alert("Terjadi kesalahan saat memperbarui")
    }
  }

  const handleAdd = async () => {
    const userId = prompt("Masukkan ID pengguna:")
    const lat = prompt("Masukkan latitude:")
    const lng = prompt("Masukkan longitude:")
    if (!userId || lat == null || lng == null) return
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, latitude: parseFloat(lat), longitude: parseFloat(lng) }),
      })
      if (res.ok) fetchData()
      else alert("Gagal menambah data")
    } catch {
      alert("Terjadi kesalahan saat menambah")
    }
  }

  const handleFilterAttendance = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/attendance?${params.toString()}`)
      const data = await response.json()
      setAttendances(Array.isArray(data) ? data : [])
    } catch (err) {
      setError("Gagal memfilter data")
    }
  }

  const downloadPDF = async () => {
    try {
      // show alert if no data (optional, server will also handle empty result)
      if (attendances.length === 0) {
        alert("Tidak ada data untuk diunduh")
        return
      }

      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (searchQuery) params.append("search", searchQuery)

      const res = await fetch(`/admin/attendance-report?${params.toString()}`, {
        method: "GET",
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Gagal mengunduh laporan")
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Laporan_Absensi_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error(err)
      alert("Kesalahan saat mengunduh laporan")
    }
  }

  const handleLogout = () => {
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    router.push("/login")
  }

  if (loading) return <div className="text-center mt-10">Memuat data...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-gray-600 text-sm font-semibold uppercase">Total Pengguna</h2>
            <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-gray-600 text-sm font-semibold uppercase">Total Absensi</h2>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalAttendance}</p>
          </div>
        </div>

        {/* Filter and actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Filter Laporan Absensi</h2>
            <button
              onClick={handleAdd}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg"
            >
              Tambah Data
            </button>
          </div>
          
          {/* Search Field */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Cari Nama / Email / Universitas / NIM</label>
            <input
              type="text"
              placeholder="Masukkan kata kunci pencarian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleFilterAttendance()
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilterAttendance}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Filter
              </button>
              <button
                onClick={downloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Universitas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">NIM</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tanggal & Jam</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Koordinat</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att, idx) => (
                <tr key={att.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"} >
                  <td className="px-6 py-4 text-sm text-gray-800">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{att.userName}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{att.userEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{att.universitas}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{att.nim}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(att.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {att.latitude.toFixed(4)}, {att.longitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 flex gap-2">
                    <button
                      onClick={() => handleEdit(att)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(att.id)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendances.length === 0 && (
            <div className="text-center py-8 text-gray-500">Tidak ada data absensi</div>
          )}
        </div>
      </div>
    </div>
  )
}
