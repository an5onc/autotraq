import { Router, Request, Response } from 'express';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';
import prisma from '../repositories/prisma.js';
import PDFDocument from 'pdfkit';

const router = Router();
router.use(authenticate);

// GET /api/reports/inventory.pdf — full inventory PDF
router.get('/inventory.pdf', requireManager, async (req: Request, res: Response) => {
  try {
    // Fetch all parts with inventory
    const parts = await prisma.part.findMany({
      orderBy: { sku: 'asc' },
      select: { id: true, sku: true, name: true, condition: true, minStock: true, costCents: true },
    });

    // Get on-hand qty for each part
    const partIds = parts.map(p => p.id);
    const events = await prisma.inventoryEvent.groupBy({
      by: ['partId'],
      where: { partId: { in: partIds } },
      _sum: { qtyDelta: true },
    });
    const qtyMap = new Map(events.map(e => [e.partId, e._sum.qtyDelta || 0]));

    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="autotraq-inventory-${new Date().toISOString().slice(0,10)}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('AutoTraq — Inventory Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Generated: ${new Date().toLocaleString()} | Parts: ${parts.length}`, { align: 'center' });
    doc.moveDown();

    // Table header
    const cols = { sku: 40, name: 160, condition: 320, onHand: 405, minStock: 455, value: 505 };
    const drawRow = (sku: string, name: string, condition: string, onHand: string, minStock: string, value: string, bold = false, alert = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      if (alert) doc.fillColor('#c0392b'); else doc.fillColor(bold ? '#000' : '#333');
      doc.text(sku, cols.sku, doc.y, { continued: true, width: 115 });
      doc.text(name, cols.name, doc.y, { continued: true, width: 155 });
      doc.text(condition, cols.condition, doc.y, { continued: true, width: 80 });
      doc.text(onHand, cols.onHand, doc.y, { continued: true, width: 45, align: 'right' });
      doc.text(minStock, cols.minStock, doc.y, { continued: true, width: 45, align: 'right' });
      doc.text(value, cols.value, doc.y, { width: 60, align: 'right' });
      doc.fillColor('#000');
    };

    // Column headers
    drawRow('SKU', 'Name', 'Condition', 'On Hand', 'Min', 'Value', true);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#333').stroke();
    doc.moveDown(0.3);

    let totalValue = 0;
    let lowStockCount = 0;

    for (const part of parts) {
      if (doc.y > 700) { doc.addPage(); }
      const qty = qtyMap.get(part.id) || 0;
      const val = qty * (part.costCents || 0) / 100;
      totalValue += val;
      const isLow = qty < part.minStock;
      if (isLow) lowStockCount++;

      drawRow(
        part.sku,
        part.name.length > 28 ? part.name.slice(0, 28) + '…' : part.name,
        part.condition,
        qty.toString(),
        part.minStock.toString(),
        val > 0 ? `$${val.toFixed(2)}` : '—',
        false,
        isLow
      );
      doc.moveDown(0.25);
    }

    // Footer summary
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#333').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold')
      .text(`Total Inventory Value: $${totalValue.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica').fillColor('#c0392b').fontSize(9)
      .text(`⚠ ${lowStockCount} parts below minimum stock (shown in red)`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('PDF report error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// GET /api/reports/low-stock.pdf — low stock only
router.get('/low-stock.pdf', requireManager, async (req: Request, res: Response) => {
  try {
    const parts = await prisma.part.findMany({
      where: { minStock: { gt: 0 } },
      orderBy: { sku: 'asc' },
      select: { id: true, sku: true, name: true, condition: true, minStock: true, costCents: true },
    });

    const events = await prisma.inventoryEvent.groupBy({
      by: ['partId'],
      where: { partId: { in: parts.map(p => p.id) } },
      _sum: { qtyDelta: true },
    });
    const qtyMap = new Map(events.map(e => [e.partId, e._sum.qtyDelta || 0]));
    const lowStock = parts.filter(p => (qtyMap.get(p.id) || 0) < p.minStock);

    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="autotraq-lowstock-${new Date().toISOString().slice(0,10)}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#c0392b').text('AutoTraq — Low Stock Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Generated: ${new Date().toLocaleString()} | ${lowStock.length} parts need reordering`, { align: 'center' });
    doc.moveDown().fillColor('#000');

    if (lowStock.length === 0) {
      doc.fontSize(14).text('✓ All parts are adequately stocked.', { align: 'center' });
    } else {
      for (const part of lowStock) {
        if (doc.y > 700) doc.addPage();
        const qty = qtyMap.get(part.id) || 0;
        const needed = part.minStock - qty;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#c0392b').text(`${part.sku} — ${part.name}`);
        doc.fontSize(9).font('Helvetica').fillColor('#333')
          .text(`Condition: ${part.condition} | On Hand: ${qty} | Min: ${part.minStock} | Need to order: ${needed}`);
        doc.moveDown(0.5);
      }
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
