import pkg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pkg;
const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';
const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

const SUPABASE_URL = 'https://voyatlhmdfbkpisdyqzy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveWF0bGhtZGZia3Bpc2R5cXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODM2MzksImV4cCI6MjEwMTk1OTYzOX0.VszLQD7zdYIHgM3LQvYjiHwMiZ1xuTXM6AWEqvOlAVs';

async function setupCleanUsers() {
  const dbClient = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  try {
    await dbClient.connect();
    console.log('✅ Connected to Supabase Database...');

    // 1. Clear existing test data cleanly
    console.log('🧹 Cleaning old test data...');
    await dbClient.query('DELETE FROM public.messages;');
    await dbClient.query('DELETE FROM public.orders;');
    await dbClient.query('DELETE FROM public.profiles;');
    await dbClient.query('DELETE FROM public.companies;');
    await dbClient.query('DELETE FROM auth.identities;');
    await dbClient.query('DELETE FROM auth.users;');

    console.log('✅ Cleaned old records.');

    // 2. Register users via official Supabase Auth API
    const testAccounts = [
      {
        email: 'admin@manpa.com.ve',
        password: 'Password123!',
        full_name: 'Administrador General MANPA',
        role: 'admin',
        company: {
          legal_name: 'Manufacturas de Papel, C.A. (MANPA)',
          tax_id: 'J-00003024-0',
          phone: '+58 212 2013111',
          contact_person: 'Gerencia Comercial MANPA',
          address: 'Av. Principal de Los Ruices, Edif. MANPA, Caracas',
          credit_limit: 1000000,
          used_credit: 0
        }
      },
      {
        email: 'distribuidor.aprobado@papelera.com',
        password: 'Password123!',
        full_name: 'Carlos Mendoza',
        role: 'distributor_approved',
        company: {
          legal_name: 'Distribuidora Papelera Caracas, C.A.',
          tax_id: 'J-30492817-4',
          phone: '+58 414 1234567',
          contact_person: 'Carlos Mendoza',
          address: 'Zona Industrial La Yaguara, Calle 3, Depósito 12, Caracas',
          credit_limit: 50000,
          used_credit: 0
        }
      },
      {
        email: 'distribuidor.pendiente@empresa.com',
        password: 'Password123!',
        full_name: 'María Gutiérrez',
        role: 'distributor_pending',
        company: {
          legal_name: 'Comercializadora de Insumos del Centro, C.A.',
          tax_id: 'J-40192837-1',
          phone: '+58 412 9876543',
          contact_person: 'María Gutiérrez',
          address: 'Zona Industrial Uncinos, Valencia, Edo. Carabobo',
          credit_limit: 0,
          used_credit: 0
        }
      }
    ];

    for (const acc of testAccounts) {
      console.log(`\n🔑 Registering user: ${acc.email}...`);
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: acc.email,
        password: acc.password,
        options: {
          data: { full_name: acc.full_name }
        }
      });

      if (signUpErr || !signUpData.user) {
        console.error(`❌ Error signing up ${acc.email}:`, signUpErr);
        continue;
      }

      const userId = signUpData.user.id;
      console.log(`✅ Native user created with ID: ${userId}`);

      // Auto-confirm email in Postgres
      await dbClient.query(
        'UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1',
        [userId]
      );

      // Create company record
      const compRes = await dbClient.query(`
        INSERT INTO public.companies (
          legal_name, tax_id, phone, contact_person, address, credit_limit, used_credit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `, [
        acc.company.legal_name,
        acc.company.tax_id,
        acc.company.phone,
        acc.company.contact_person,
        acc.company.address,
        acc.company.credit_limit,
        acc.company.used_credit
      ]);

      const companyId = compRes.rows[0].id;

      // Create profile record
      await dbClient.query(`
        INSERT INTO public.profiles (
          id, company_id, full_name, role, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW());
      `, [userId, companyId, acc.full_name, acc.role]);

      console.log(`✅ Profile & Company linked for ${acc.email} with role ${acc.role}`);
    }

    // 3. Test signInWithPassword for all accounts
    console.log('\n🧪 VERIFYING AUTHENTICATION SIGN-IN FOR ALL ACCOUNTS:');
    for (const acc of testAccounts) {
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password
      });

      if (loginErr) {
        console.error(`❌ Login failed for ${acc.email}:`, loginErr.message);
      } else {
        console.log(`🎉 LOGIN 100% SUCCESSFUL for ${acc.email} (Role: ${acc.role})! Token received: ${loginData.session.access_token.slice(0, 20)}...`);
      }
    }

  } catch (err) {
    console.error('❌ Unexpected setup error:', err);
  } finally {
    await dbClient.end();
  }
}

setupCleanUsers();
