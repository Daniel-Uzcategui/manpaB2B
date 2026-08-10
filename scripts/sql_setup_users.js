import pkg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pkg;
const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';
const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

const SUPABASE_URL = 'https://voyatlhmdfbkpisdyqzy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveWF0bGhtZGZia3Bpc2R5cXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODM2MzksImV4cCI6MjEwMTk1OTYzOX0.VszLQD7zdYIHgM3LQvYjiHwMiZ1xuTXM6AWEqvOlAVs';

async function sqlSetupUsers() {
  const dbClient = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  try {
    await dbClient.connect();
    console.log('✅ Connected to Supabase DB via Pooler...');

    // Clean old
    await dbClient.query('DELETE FROM public.messages;');
    await dbClient.query('DELETE FROM public.orders;');
    await dbClient.query('DELETE FROM public.profiles;');
    await dbClient.query('DELETE FROM public.companies;');
    await dbClient.query('DELETE FROM auth.identities;');
    await dbClient.query('DELETE FROM auth.users;');

    const testAccounts = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
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
        id: 'b0000000-0000-0000-0000-000000000002',
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
        id: 'c0000000-0000-0000-0000-000000000003',
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
      // Insert into auth.users
      await dbClient.query(`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          created_at,
          updated_at,
          is_sso_user,
          is_anonymous
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1::uuid,
          'authenticated',
          'authenticated',
          $2,
          extensions.crypt($3, extensions.gen_salt('bf', 10)),
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('full_name', $4::text),
          false,
          NOW(),
          NOW(),
          false,
          false
        );
      `, [acc.id, acc.email, acc.password, acc.full_name]);

      // Insert into auth.identities
      await dbClient.query(`
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
          'email',
          $1::text,
          NOW(),
          NOW(),
          NOW()
        );
      `, [acc.id, acc.email]);

      // Insert company
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

      // Insert profile
      await dbClient.query(`
        INSERT INTO public.profiles (
          id, company_id, full_name, role, created_at
        ) VALUES ($1::uuid, $2::uuid, $3, $4, NOW());
      `, [acc.id, companyId, acc.full_name, acc.role]);

      console.log(`✅ Fully seeded user, identity, company & profile for: ${acc.email}`);
    }

    // TEST SIGN IN
    console.log('\n🧪 TESTING SIGN IN FOR ALL TEST ACCOUNTS:');
    for (const acc of testAccounts) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password
      });

      if (error) {
        console.error(`❌ SIGN IN FAILED for ${acc.email}:`, error);
      } else {
        console.log(`🎉 SIGN IN WORKED 100% FOR ${acc.email}! Token: ${data.session.access_token.slice(0, 25)}...`);
      }
    }

  } catch (err) {
    console.error('❌ SQL Setup Error:', err);
  } finally {
    await dbClient.end();
  }
}

sqlSetupUsers();
