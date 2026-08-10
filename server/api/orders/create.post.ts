import { createError, defineEventHandler, readBody } from 'h3';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  );

  // 1. Authenticate Request JWT
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

  if (userErr || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid user token' });
  }

  // 2. Fetch User Profile and Company
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'distributor_approved' && profile.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cuenta no aprobada para realizar pedidos mayoristas.',
    });
  }

  const company = profile.company;
  if (!company) {
    throw createError({ statusCode: 400, statusMessage: 'No company linked to distributor profile.' });
  }

  const body = await readBody(event);
  const { items, paymentMethod, shippingAddress, notes } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cart items are required' });
  }

  // 3. Validate Stock & Calculate Totals using RPC Price Resolver
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const { productId, quantity } = item;

    // Fetch product stock and details
    const { data: prodData, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('name, stock, is_active')
      .eq('id', productId)
      .single();

    if (prodErr || !prodData) {
      throw createError({ statusCode: 404, statusMessage: `Producto con ID ${productId} no existe.` });
    }

    if (!prodData.is_active) {
      throw createError({ statusCode: 400, statusMessage: `El producto ${prodData.name} no está activo.` });
    }

    // High Priority Gap: Stock Validation
    if (quantity > prodData.stock) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stock insuficiente para ${prodData.name}. Solicitado: ${quantity} ud, Disponible en planta: ${prodData.stock} ud.`,
      });
    }

    // Call Supabase RPC for authoritative price
    const { data: verifiedPrice } = await supabaseAdmin.rpc('get_effective_product_price', {
      p_product_id: productId,
      p_user_id: user.id,
      p_qty: quantity,
    });

    const unitPrice = verifiedPrice || item.unitPrice || 0;
    const itemTotal = Number((unitPrice * quantity).toFixed(2));

    subtotal += itemTotal;
    processedItems.push({
      product_id: productId,
      quantity,
      unit_price: unitPrice,
      total_price: itemTotal,
      current_stock: prodData.stock,
      name: prodData.name,
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const taxAmount = Number((subtotal * 0.16).toFixed(2)); // 16% IVA
  const total = Number((subtotal + taxAmount).toFixed(2));

  // 4. High Priority Gap: Credit Limit Validation
  if (paymentMethod === 'credit_30_days' || paymentMethod === 'credit_60_days') {
    const creditLimit = Number(company.credit_limit || 0);
    const usedCredit = Number(company.used_credit || 0);
    const availableCredit = Number((creditLimit - usedCredit).toFixed(2));

    if (total > availableCredit) {
      throw createError({
        statusCode: 400,
        statusMessage: `Límite de crédito excedido. El total del pedido ($${total} USD) supera su crédito disponible ($${availableCredit} USD de $${creditLimit} USD asignados).`,
      });
    }

    // Deduct available credit by updating used_credit
    const newUsedCredit = Number((usedCredit + total).toFixed(2));
    await supabaseAdmin
      .from('companies')
      .update({ used_credit: newUsedCredit })
      .eq('id', company.id);
  }

  // 5. Determine Initial Order Status
  let initialStatus = 'pending_approval';
  if (paymentMethod === 'wire_transfer') {
    initialStatus = 'awaiting_payment';
  } else if (paymentMethod === 'credit_30_days' || paymentMethod === 'credit_60_days') {
    initialStatus = 'pending_approval';
  }

  // 6. Create Order Entry
  const { data: orderData, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert([
      {
        company_id: company.id,
        user_id: user.id,
        status: initialStatus,
        subtotal,
        tax_amount: taxAmount,
        shipping_cost: 0.00,
        total,
        payment_method: paymentMethod,
        shipping_calc_type: 'quote_required',
        shipping_address: shippingAddress || company.address,
        notes,
      },
    ])
    .select()
    .single();

  if (orderErr || !orderData) {
    console.error('Order creation error:', orderErr);
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order entry' });
  }

  // 7. Insert Items & Decrement Stock
  for (const item of processedItems) {
    await supabaseAdmin.from('order_items').insert([
      {
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      },
    ]);

    // High Priority Gap: Auto Decrement Stock
    const newStock = Math.max(0, item.current_stock - item.quantity);
    await supabaseAdmin
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.product_id);
  }

  // 8. Trigger Email Notification via Resend (Sales Alert & Customer PO Receipt)
  if (config.resendApiKey && user.email) {
    try {
      const resend = new Resend(config.resendApiKey);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 32px; color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
            <h2 style="color: #38bdf8; margin-top: 0;">Orden de Compra B2B Emitida #${orderData.order_number}</h2>
            <p><strong>Empresa:</strong> ${company.legal_name} (RIF: ${company.tax_id})</p>
            <p><strong>Representante:</strong> ${profile.full_name}</p>
            <p><strong>Método de Pago:</strong> ${paymentMethod.toUpperCase()}</p>
            <p><strong>Total Pedido:</strong> <span style="color: #4ade80; font-weight: bold;">$${total} USD</span></p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
            <p style="font-size: 13px; color: #94a3b8;">Su orden ha sido registrada exitosamente en el sistema MANPA. Puede descargar la proforma en PDF ingresando a su portal.</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'MANPA B2B <pedidos@manpa.com.ve>',
        to: [user.email, 'ventas@manpa.com.ve'],
        subject: `📋 Nueva Orden de Compra B2B #${orderData.order_number} - ${company.legal_name}`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error('Failed to send order confirmation email:', emailErr);
    }
  }

  return {
    success: true,
    orderId: orderData.id,
    orderNumber: orderData.order_number,
    total,
    status: initialStatus,
  };
});
