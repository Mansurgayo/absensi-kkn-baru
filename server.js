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
  const filters = [];

  // Add date filter
  if (startDate || endDate) {
    const dateFilter = { createdAt: {} };
    if (startDate) dateFilter.createdAt.gte = new Date(startDate + 'T00:00:00Z');
    if (endDate) dateFilter.createdAt.lte = new Date(endDate + 'T23:59:59Z');
    filters.push(dateFilter);
  }

  // Add search filter
  if (search) {
    filters.push({
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { universitas: { contains: search, mode: 'insensitive' } } },
        { user: { nim: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  // Combine all filters with AND
  if (filters.length === 1) {
    Object.assign(where, filters[0]);
  } else if (filters.length > 1) {
    where.AND = filters;
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
  // Set headers BEFORE creating document
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="laporan_absensi.pdf"');

  try {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    // Handle errors during PDF generation
    doc.on('error', (err) => {
      console.error('PDF Document error:', err);
      res.end();
    });

    // Handle stream errors
    res.on('error', (err) => {
      console.error('Response stream error:', err);
      doc.end();
    });

    doc.pipe(res);

    // header
    doc.fontSize(16).text('LAPORAN ABSENSI KKN', { align: 'center' });
    doc.moveDown(0.5);
    const now = new Date();
    doc.fontSize(10).text(`Tanggal: ${now.toLocaleDateString('id-ID')}  Waktu: ${now.toLocaleTimeString('id-ID')}`, { align: 'left' });
    doc.moveDown(1);

    if (attendances.length === 0) {
      doc.fontSize(12).text('Tidak ada data absensi untuk ditampilkan.', { align: 'center' });
      doc.end();
      return;
    }

    // table header with dynamic column widths
    const pageMargin = 40;
    const pageWidth = 595 - (pageMargin * 2); // A4 width
    const rowHeight = 15;
    let tableTop = doc.y;

    const columns = ['No', 'Nama', 'Email', 'Universitas', 'NIM', 'Tanggal & Jam', 'Lat', 'Lng'];
    const columnWidths = [30, 80, 100, 80, 60, 100, 45, 45]; // adjusted widths

    // Draw table header
    doc.font('Helvetica-Bold').fontSize(8);
    let xPos = pageMargin;
    for (let i = 0; i < columns.length; i++) {
      doc.text(columns[i], xPos, tableTop, { width: columnWidths[i], align: 'left' });
      xPos += columnWidths[i];
    }

    tableTop += rowHeight;
    doc.moveTo(pageMargin, tableTop).lineTo(pageMargin + pageWidth, tableTop).stroke();
    tableTop += 5;

    // rows
    doc.font('Helvetica').fontSize(7);
    for (let i = 0; i < attendances.length; i++) {
      const att = attendances[i];

      // Check if we need a new page
      if (tableTop > 750) {
        doc.addPage();
        tableTop = pageMargin + 20;
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
      ];

      xPos = pageMargin;
      for (let j = 0; j < values.length; j++) {
        doc.text(values[j], xPos, tableTop, { width: columnWidths[j], align: 'left' });
        xPos += columnWidths[j];
      }

      tableTop += rowHeight;
    }

    doc.end();
  } catch (err) {
    console.error('buildPdfStream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF generation failed' });
    }
  }
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