import pkg from 'pg';
const { Client } = pkg;

const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';
const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

async function seedIdentities() {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase DB...');

    const users = await client.query('SELECT id, email FROM auth.users');

    for (const u of users.rows) {
      await client.query(`
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
          jsonb_build_object('sub', $2::text, 'email', $3::text, 'email_verified', true),
          'email',
          $3::text,
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING;
      `, [u.id, u.id.toString(), u.email]);

      console.log(`✅ Seeded auth.identity for user: ${u.email}`);
    }

    const check = await client.query('SELECT id, user_id, provider, identity_data FROM auth.identities');
    console.log('\nVerified Auth Identities:');
    console.table(check.rows);

  } catch (err) {
    console.error('❌ Error seeding identities:', err);
  } finally {
    await client.end();
  }
}

seedIdentities();
