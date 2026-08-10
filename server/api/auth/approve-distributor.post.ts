import { createError, defineEventHandler, readBody } from 'h3';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Initialize Admin Supabase client with service role key
  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  );

  // Extract auth header or session from event
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

  if (userErr || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid user token' });
  }

  // Verify caller is admin
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin authorization required' });
  }

  // Read request body
  const body = await readBody(event);
  const { profileId, priceListId } = body;

  if (!profileId) {
    throw createError({ statusCode: 400, statusMessage: 'profileId is required' });
  }

  // Fetch target profile and associated company details
  const { data: targetProfile, error: targetErr } = await supabaseAdmin
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', profileId)
    .single();

  if (targetErr || !targetProfile) {
    throw createError({ statusCode: 404, statusMessage: 'Distributor profile not found' });
  }

  // Update profile status to distributor_approved
  const { error: updateProfErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'distributor_approved' })
    .eq('id', profileId);

  if (updateProfErr) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update profile status' });
  }

  // Optionally assign custom price list to company
  if (priceListId && targetProfile.company_id) {
    await supabaseAdmin
      .from('companies')
      .update({ price_list_id: priceListId })
      .eq('id', targetProfile.company_id);
  }

  // Get user auth email
  const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(profileId);
  const targetEmail = authUserData.user?.email;

  // Trigger Resend email if API key is present
  let emailSent = false;
  if (config.resendApiKey && targetEmail) {
    try {
      const resend = new Resend(config.resendApiKey);

      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; padding: 40px; color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
            <h1 style="color: #38bdf8; font-size: 24px; font-weight: 800; margin-bottom: 16px;">¡Bienvenido al Portal B2B de MANPA!</h1>
            <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6;">Estimado/a <strong>${targetProfile.full_name}</strong>,</p>
            <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6;">Nos complace informarle que su solicitud de registro para la empresa <strong>${targetProfile.company?.legal_name || 'su empresa'}</strong> ha sido <strong style="color: #4ade80;">APROBADA</strong> por nuestro equipo de atención al distribuidor.</p>
            
            <div style="background-color: #090d16; border-left: 4px solid #0284c7; padding: 16px; border-radius: 6px; margin: 24px 0;">
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">Ya tiene acceso completo para:</p>
              <ul style="color: #f1f5f9; font-size: 14px; margin: 8px 0 0 20px; padding: 0;">
                <li>Visualizar precios corporativos al mayor en USD y VES.</li>
                <li>Realizar pedidos directos con volumen mínimo MOQ.</li>
                <li>Descargar Hojas Técnicas y Facturación Proforma PDF.</li>
                <li>Acceder a plazos de pago y atención directa de ejecutivo.</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 32px;">
              <a href="${config.public.siteUrl || 'https://manpa.com.ve'}/app/dashboard" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Ingresar al Portal B2B</a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #334155; margin: 32px 0 16px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">Manufacturas de Papel, C.A. (MANPA) - Departamento de Ventas Corporativas</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'MANPA B2B <ventas@manpa.com.ve>',
        to: [targetEmail],
        subject: '🎉 Solicitud Aprobada - Portal de Distribuidores MANPA B2B',
        html: htmlContent,
      });

      emailSent = true;
    } catch (emailErr) {
      console.error('Failed to send Resend email:', emailErr);
    }
  }

  return {
    success: true,
    message: 'Distributor approved successfully',
    emailSent,
  };
});
