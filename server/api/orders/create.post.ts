import { createError, defineEventHandler, readBody } from 'h3';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  );

  const authHeader = getHeader(event, 'authorization');
  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

  if (userErr || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid user token' });
  }

  // Fetch profile and company
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'distributor_approved' && profile.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cuenta no aprobada para realizar pedidos mayoristas.',
    });
  }

  const body = await readBody(event);
  const { items, paymentMethod, shippingAddress, notes } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cart items are required' });
  }

  // Validate items & calculate authoritative subtotal using RPC get_effective_product_price
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const { productId, quantity } = item;

    // Call Supabase RPC for price verification
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
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const taxAmount = Number((subtotal * 0.16).toFixed(2)); // 16% IVA
  const total = Number((subtotal + taxAmount).toFixed(2));

  // Determine initial status based on payment method
  let initialStatus = 'pending_approval';
  if (paymentMethod === 'credit_30_days' || paymentMethod === 'credit_60_days') {
    initialStatus = 'pending_approval';
  } else if (paymentMethod === 'wire_transfer') {
    initialStatus = 'awaiting_payment';
  }

  // Create Order in Database
  const { data: orderData, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert([
      {
        company_id: profile.company_id,
        user_id: user.id,
        status: initialStatus,
        subtotal,
        tax_amount: taxAmount,
        shipping_cost: 0.00,
        total,
        payment_method: paymentMethod,
        shipping_calc_type: 'quote_required',
        shipping_address: shippingAddress || profile.company?.address,
        notes,
      },
    ])
    .select()
    .single();

  if (orderErr || !orderData) {
    console.error('Order creation error:', orderErr);
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order' });
  }

  // Insert Order Items
  const itemsToInsert = processedItems.map((pi) => ({
    ...pi,
    order_id: orderData.id,
  }));

  const { error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsErr) {
    console.error('Order items insertion error:', itemsErr);
  }

  return {
    success: true,
    orderId: orderData.id,
    orderNumber: orderData.order_number,
    total,
    status: initialStatus,
  };
});
