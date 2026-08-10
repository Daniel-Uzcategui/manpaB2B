import type { Profile, Company } from '~/types';

export const useB2BAuth = () => {
  const supabase = useB2BSupabaseClient();

  const profile = useState<Profile | null>('b2b_profile', () => null);
  const company = useState<Company | null>('b2b_company', () => null);
  const user = useState<any>('b2b_user', () => null);
  const loading = useState<boolean>('b2b_auth_loading', () => false);

  const isApprovedDistributor = computed(() => profile.value?.role === 'distributor_approved');
  const isPendingDistributor = computed(() => profile.value?.role === 'distributor_pending');
  const isAdmin = computed(() => profile.value?.role === 'admin');

  const fetchProfile = async () => {
    try {
      loading.value = true;
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;
      user.value = currentUser;

      if (!currentUser) {
        profile.value = null;
        company.value = null;
        return;
      }

      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profErr && profErr.code !== 'PGRST116') {
        console.error('Error fetching profile:', profErr);
      }

      if (profData) {
        profile.value = profData as Profile;

        if (profData.company_id) {
          const { data: compData, error: compErr } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profData.company_id)
            .single();

          if (!compErr && compData) {
            company.value = compData as Company;
          }
        }
      }
    } catch (e) {
      console.error('Auth fetch error:', e);
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    profile.value = null;
    company.value = null;
    user.value = null;
    return navigateTo('/auth/login');
  };

  return {
    user,
    profile,
    company,
    loading,
    isApprovedDistributor,
    isPendingDistributor,
    isAdmin,
    fetchProfile,
    logout,
  };
};
