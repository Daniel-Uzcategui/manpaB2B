import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';

const regions = [
  'us-east-1',
  'us-west-1',
  'us-east-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1'
];

async function findRegionAndMigrate() {
  let connectedClient = null;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:6543/postgres`;
    console.log(`Testing region ${region} (${host})...`);

    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Connected via pooler region: ${region}`);
      connectedClient = client;
      break;
    } catch (err) {
      if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND')) {
        console.log(`Region ${region} responded with: ${err.message}`);
      }
    }
  }

  if (!connectedClient) {
    console.error('❌ Could not connect via pooler. Falling back to Supabase CLI / Management API instructions.');
    process.exit(1);
  }

  try {
    const initSql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260810_init.sql'), 'utf-8');
    const storageSql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260810_storage_and_credit.sql'), 'utf-8');

    console.log('🚀 Running 20260810_init.sql migration...');
    await connectedClient.query(initSql);
    console.log('✅ 20260810_init.sql migration executed successfully!');

    console.log('🚀 Running 20260810_storage_and_credit.sql migration...');
    await connectedClient.query(storageSql);
    console.log('✅ 20260810_storage_and_credit.sql migration executed successfully!');

    console.log('🎉 ALL SUPABASE DATABASE & STORAGE MIGRATIONS APPLIED CLEANLY!');
  } catch (err) {
    console.error('❌ Error executing SQL migrations:', err);
  } finally {
    await connectedClient.end();
  }
}

findRegionAndMigrate();
