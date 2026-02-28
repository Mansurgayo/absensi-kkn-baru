const express = require('express');
const next = require('next');
const PDFDocument = require('pdfkit');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// middleware to verify admin role based on cookie
async function verifyAdmin(req, res, next) {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // attach user to request if needed
    req.user = user;
    next();
  } catch (err) {
    console.error('verifyAdmin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function fetchAttendances(startDate, endDate, search) {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00Z');
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');
  }

  // Add search filter
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { universitas: { contains: search, mode: 'insensitive' } } },
      { user: { nim: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          universitas: true,
          nim: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return attendances;
}

function buildPdfStream(attendances, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  // pipe PDF data straight to response
  res.setHeader('Content-Type', 'application/pdf');
  // recommend setting Content-Disposition for download
  res.setHeader('Content-Disposition', 'attachment; filename="laporan_absensi.pdf"');

  doc.pipe(res);

  // header
  doc.fontSize(16).text('LAPORAN ABSENSI KKN', { align: 'center' });
  doc.moveDown(0.5);
  const now = new Date();
  doc.fontSize(10).text(`Tanggal: ${now.toLocaleDateString('id-ID')}  Waktu: ${now.toLocaleTimeString('id-ID')}`, { align: 'left' });
  doc.moveDown(1);

  // table header
  const tableTop = doc.y;
  const columnSpacing = 70;
  const columns = ['No', 'Nama', 'Email', 'Universitas', 'NIM', 'Tanggal & Jam', 'Lat', 'Lng'];

  columns.forEach((col, i) => {
    doc.font('Helvetica-Bold').fontSize(9).text(col, 40 + i * columnSpacing, tableTop);
  });

  // rows
  let i = 0;
  attendances.forEach((att) => {
    const rowY = tableTop + 20 + i * 20;
    const values = [
      i + 1,
      att.user.name,
      att.user.email,
      att.user.universitas || '-',
      att.user.nim || '-',
      new Date(att.createdAt).toLocaleString('id-ID'),
      att.latitude.toFixed(6),
      att.longitude.toFixed(6),
    ];
    values.forEach((val, j) => {
      doc.font('Helvetica').fontSize(8).text(val.toString(), 40 + j * columnSpacing, rowY, {
        width: columnSpacing - 4,
        ellipsis: true,
      });
    });
    i += 1;
  });

  doc.end();
}

app.prepare().then(() => {
  const server = express();

  server.use(cookieParser());

  // pdf generation route
  server.get('/admin/attendance-report', verifyAdmin, async (req, res) => {
    try {
      const { startDate, endDate, search } = req.query;
      const attendances = await fetchAttendances(startDate, endDate, search);
      buildPdfStream(attendances, res);
    } catch (err) {
      console.error('PDF route error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // delegate all other requests to Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const port = process.env.PORT || 5000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});