import { prisma } from "../../../../lib/prisma"
import { PassThrough } from "stream"

function parseCookies(cookieHeader: string | null) {
  const map: Record<string, string> = {}
  if (!cookieHeader) return map
  const parts = cookieHeader.split(';')
  for (const p of parts) {
    const [k, ...v] = p.split('=')
    map[k.trim()] = decodeURIComponent(v.join('=').trim())
  }
  return map
}

async function fetchAttendances(startDate?: string, endDate?: string, search?: string) {
  const where: any = {}
  const filters: any[] = []

  if (startDate || endDate) {
    const dateFilter: any = { createdAt: {} }
    if (startDate) dateFilter.createdAt.gte = new Date(startDate + 'T00:00:00Z')
    if (endDate) dateFilter.createdAt.lte = new Date(endDate + 'T23:59:59Z')
    filters.push(dateFilter)
  }

  if (search) {
    filters.push({
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { universitas: { contains: search, mode: 'insensitive' } } },
        { user: { nim: { contains: search, mode: 'insensitive' } } },
      ],
    })
  }

  if (filters.length === 1) Object.assign(where, filters[0])
  else if (filters.length > 1) where.AND = filters

  const attendances = await prisma.attendance.findMany({
    where,
    include: { user: { select: { name: true, email: true, universitas: true, nim: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return attendances
}

async function buildPdfBuffer(attendances: any[]) {
  const { default: PDFDocument } = await import('pdfkit/js/pdfkit.js')
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const stream = new PassThrough()
      const chunks: Buffer[] = []

      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', (err) => reject(err))

      doc.pipe(stream)

      doc.fontSize(16).text('LAPORAN ABSENSI KKN', { align: 'center' })
      doc.moveDown(0.5)
      const now = new Date()
      doc.fontSize(10).text(`Tanggal: ${now.toLocaleDateString('id-ID')}  Waktu: ${now.toLocaleTimeString('id-ID')}`, { align: 'left' })
      doc.moveDown(1)

      if (attendances.length === 0) {
        doc.fontSize(12).text('Tidak ada data absensi untuk ditampilkan.', { align: 'center' })
        doc.end()
        return
      }

      const pageMargin = 40
      const rowHeight = 15
      let tableTop = doc.y

      const columns = ['No', 'Nama', 'Email', 'Universitas', 'NIM', 'Tanggal & Jam', 'Lat', 'Lng']
      const columnWidths = [30, 80, 100, 80, 60, 100, 45, 45]

      doc.font('Helvetica-Bold').fontSize(8)
      let xPos = pageMargin
      for (let i = 0; i < columns.length; i++) {
        doc.text(columns[i], xPos, tableTop, { width: columnWidths[i], align: 'left' })
        xPos += columnWidths[i]
      }

      tableTop += rowHeight
      doc.moveTo(pageMargin, tableTop).lineTo(pageMargin + (595 - (pageMargin * 2)), tableTop).stroke()
      tableTop += 5

      doc.font('Helvetica').fontSize(7)
      for (let i = 0; i < attendances.length; i++) {
        const att = attendances[i]

        if (tableTop > 750) {
          doc.addPage()
          tableTop = pageMargin + 20
        }

        const values = [
          (i + 1).toString(),
          att.user.name,
          att.user.email,
          att.user.universitas || '-',
          att.user.nim || '-',
          new Date(att.createdAt).toLocaleString('id-ID'),
          att.latitude.toFixed(6),
          att.longitude.toFixed(6),
        ]

        xPos = pageMargin
        for (let j = 0; j < values.length; j++) {
          doc.text(values[j], xPos, tableTop, { width: columnWidths[j], align: 'left' })
          xPos += columnWidths[j]
        }

        tableTop += rowHeight
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie')
    const cookies = parseCookies(cookieHeader)
    const userId = cookies.userId
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

    const url = new URL(req.url)
    const startDate = url.searchParams.get('startDate') || undefined
    const endDate = url.searchParams.get('endDate') || undefined
    const search = url.searchParams.get('search') || undefined

    const attendances = await fetchAttendances(startDate, endDate, search)
    const pdfBuffer = await buildPdfBuffer(attendances)

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="laporan_absensi.pdf"',
      },
    })
  } catch (err) {
    console.error('API attendance-report error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
