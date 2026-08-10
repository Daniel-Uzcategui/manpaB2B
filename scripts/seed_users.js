import pkg from 'pg';
const { Client } = pkg;

const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';
const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

async function seedTestUsers() {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase DB for user seeding...');

    // Enable pgcrypto extension if not present
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;`);

    // Define test users data
    const usersData = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@manpa.com.ve',
        password: 'Password123!',
        fullName: 'Administrador General MANPA',
        role: 'admin',
        company: null
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        email: 'distribuidor.aprobado@papelera.com',
        password: 'Password123!',
        fullName: 'Carlos Mendoza',
        role: 'distributor_approved',
        company: {
          id: 'c0000000-0000-0000-0000-000000000001',
          legalName: 'Inversiones Papeleras C.A.',
          taxId: 'J-12345678-9',
          phone: '+58 414 1234567',
          contactPerson: 'Carlos Mendoza',
          address: 'Av. Principal de Maracay, Almacén 4, Aragua',
          creditLimit: 10000.00
        }
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        email: 'distribuidor.pendiente@empresa.com',
        password: 'Password123!',
        fullName: 'María Rodríguez',
        role: 'distributor_pending',
        company: {
          id: 'c0000000-0000-0000-0000-000000000002',
          legalName: 'Distribuidora Centro C.A.',
          taxId: 'J-98765432-1',
          phone: '+58 412 9876543',
          contactPerson: 'María Rodríguez',
          address: 'Zona Industrial Valencia, Galpón 12, Carabobo',
          creditLimit: 0.00
        }
      }
    ];

    for (const u of usersData) {
      // 1. Insert or update Company if applicable
      let companyId = null;
      if (u.company) {
        companyId = u.company.id;
        await client.query(`
          INSERT INTO public.companies (id, legal_name, tax_id, phone, contact_person, address, credit_limit, used_credit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 0.00)
          ON CONFLICT (id) DO UPDATE SET
            legal_name = EXCLUDED.legal_name,
            tax_id = EXCLUDED.tax_id,
            credit_limit = EXCLUDED.credit_limit;
        `, [
          u.company.id,
          u.company.legalName,
          u.company.taxId,
          u.company.phone,
          u.company.contactPerson,
          u.company.address,
          u.company.creditLimit
        ]);
      }

      // 2. Insert into auth.users (Supabase Auth Table)
      await client.query(`
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          aud,
          role,
          created_at,
          updated_at
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          $2,
          extensions.crypt($3::text, extensions.gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('full_name', $4::text),
          'authenticated',
          'authenticated',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          encrypted_password = extensions.crypt($3::text, extensions.gen_salt('bf')),
          email_confirmed_at = NOW();
      `, [u.id, u.email, u.password, u.fullName]);

      // 3. Insert or update public.profiles
      await client.query(`
        INSERT INTO public.profiles (id, company_id, full_name, role, tax_doc_url, mercantile_doc_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          company_id = EXCLUDED.company_id,
          role = EXCLUDED.role,
          full_name = EXCLUDED.full_name;
      `, [
        u.id,
        companyId,
        u.fullName,
        u.role,
        'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
      ]);

      console.log(`👤 Seeded User: ${u.email} (Role: ${u.role})`);
    }

    console.log('\n🎉 ALL TEST USERS CREATED SUCCESSFULLY IN SUPABASE!');
  } catch (err) {
    console.error('❌ Error seeding users:', err);
  } finally {
    await client.end();
  }
}

seedTestUsers();
