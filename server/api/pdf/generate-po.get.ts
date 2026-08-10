import { createError, defineEventHandler, getQuery } from 'h3';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const orderId = query.id as string;

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID parameter is required' });
  }

  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  );

  // Fetch complete order details
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, company:companies(*), profile:profiles(*), items:order_items(*, product:products(*))')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Order record not found' });
  }

  // Create jsPDF Document
  const doc = new jsPDF();

  // Header Banner & Branding
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MANPA B2B', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248); // #38bdf8
  doc.text('Manufacturas de Papel, C.A. - Orden de Compra / Proforma', 14, 30);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`ORDEN #${order.order_number}`, 150, 22);

  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString('es-VE')}`, 150, 30);

  // Distributor & Company Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL DISTRIBUIDOR:', 14, 52);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Empresa: ${order.company?.legal_name || 'N/A'}`, 14, 60);
  doc.text(`RIF / NIT: ${order.company?.tax_id || 'N/A'}`, 14, 67);
  doc.text(`Contacto: ${order.profile?.full_name || 'N/A'}`, 14, 74);
  doc.text(`Dirección: ${order.shipping_address || order.company?.address || 'N/A'}`, 14, 81);

  // Order Metadata Right Box
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE PAGO:', 130, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`Forma de Pago: ${order.payment_method?.toUpperCase()}`, 130, 60);
  doc.text(`Estado: ${order.status?.toUpperCase()}`, 130, 67);

  // Items Table
  const tableData = (order.items || []).map((item: any) => [
    item.product?.sku || 'N/A',
    item.product?.name || 'Producto',
    `${item.quantity} ud`,
    `$${Number(item.unit_price).toFixed(2)}`,
    `$${Number(item.total_price).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 92,
    head: [['SKU', 'DESCRIPCIÓN DE PRODUCTO', 'CANTIDAD', 'PRECIO UNIT (USD)', 'SUBTOTAL (USD)']],
    body: tableData,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals Summary Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`$${Number(order.subtotal).toFixed(2)}`, 180, finalY);

  doc.text(`IVA (16%):`, 140, finalY + 7);
  doc.text(`$${Number(order.tax_amount || 0).toFixed(2)}`, 180, finalY + 7);

  doc.text(`Flete Estimado:`, 140, finalY + 14);
  doc.text(`$${Number(order.shipping_cost || 0).toFixed(2)}`, 180, finalY + 14);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(`TOTAL GENERAL:`, 140, finalY + 24);
  doc.text(`$${Number(order.total).toFixed(2)} USD`, 175, finalY + 24);

  // Footer Note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Esta proforma es un comprobante de orden emitido electrónicamente por el sistema MANPA B2B.', 14, 280);

  // Output PDF as Buffer
  const pdfArrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfArrayBuffer);

  setHeader(event, 'Content-Type', 'application/pdf');
  setHeader(event, 'Content-Disposition', `inline; filename="MANPA_PO_${order.order_number}.pdf"`);

  return buffer;
});
