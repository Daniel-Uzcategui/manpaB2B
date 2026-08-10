import pkg from 'pg';
const { Client } = pkg;

const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';
const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

async function fixHashes() {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase DB...');

    const emails = ['admin@manpa.com.ve', 'distribuidor.aprobado@papelera.com', 'distribuidor.pendiente@empresa.com'];

    for (const email of emails) {
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = extensions.crypt('Password123!', extensions.gen_salt('bf', 10)),
            email_confirmed_at = NOW(),
            aud = 'authenticated',
            role = 'authenticated'
        WHERE email = $1;
      `, [email]);

      console.log(`✅ Updated password hash for: ${email}`);
    }

    // Verify users
    const res = await client.query(`
      SELECT id, email, role, aud, email_confirmed_at, encrypted_password
      FROM auth.users
      WHERE email IN ('admin@manpa.com.ve', 'distribuidor.aprobado@papelera.com', 'distribuidor.pendiente@empresa.com');
    `);

    console.log('\nVerified Auth Users in Database:');
    console.table(res.rows);

  } catch (err) {
    console.error('❌ Error updating hashes:', err);
  } finally {
    await client.end();
  }
}

fixHashes();
