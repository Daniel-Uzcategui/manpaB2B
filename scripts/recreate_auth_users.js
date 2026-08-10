import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://voyatlhmdfbkpisdyqzy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveWF0bGhtZGZia3Bpc2R5cXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM4MzYzOSwiZXhwIjoyMTAxOTU5NjM5fQ.Or5VIuZzAOB64b7jPCVrMCb5_9IQ7dpBiUE-zZNTrcw';

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function recreateUsers() {
  console.log('🚀 Re-creating users via Supabase Admin API...');

  const testUsers = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@manpa.com.ve',
      password: 'Password123!',
      user_metadata: { full_name: 'Administrador General MANPA' }
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      email: 'distribuidor.aprobado@papelera.com',
      password: 'Password123!',
      user_metadata: { full_name: 'Distribuidor Aprobado C.A.' }
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      email: 'distribuidor.pendiente@empresa.com',
      password: 'Password123!',
      user_metadata: { full_name: 'Distribuidor Pendiente C.A.' }
    }
  ];

  for (const u of testUsers) {
    // First attempt to delete user by ID if exists
    try {
      await adminSupabase.auth.admin.deleteUser(u.id);
      console.log(`Deleted existing user: ${u.email}`);
    } catch (e) {
      console.log(`No existing user to delete for: ${u.email}`);
    }

    // Create user natively via GoTrue Admin API
    const { data, error } = await adminSupabase.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.user_metadata
    });

    if (error) {
      console.error(`❌ Error creating user ${u.email}:`, error);
    } else {
      console.log(`✅ Native user created successfully: ${data.user.email} (ID: ${data.user.id})`);
    }
  }

  // Verify login with anon client
  console.log('\n🧪 Testing signInWithPassword for admin@manpa.com.ve...');
  const anonSupabase = createClient(
    SUPABASE_URL,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveWF0bGhtZGZia3Bpc2R5cXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODM2MzksImV4cCI6MjEwMTk1OTYzOX0.VszLQD7zdYIHgM3LQvYjiHwMiZ1xuTXM6AWEqvOlAVs'
  );

  const loginRes = await anonSupabase.auth.signInWithPassword({
    email: 'admin@manpa.com.ve',
    password: 'Password123!'
  });

  if (loginRes.error) {
    console.error('❌ Test Login Failed:', loginRes.error);
  } else {
    console.log('🎉 TEST LOGIN SUCCESSFUL! Token received for user:', loginRes.data.user.email);
  }
}

recreateUsers();
