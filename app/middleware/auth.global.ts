export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();
  const { profile, fetchProfile, isAdmin, isApprovedDistributor, isPendingDistributor } = useB2BAuth();

  // If user is authenticated but profile is not loaded yet, fetch it
  if (user.value && !profile.value) {
    await fetchProfile();
  }

  const isAppRoute = to.path.startsWith('/app');
  const isAdminRoute = to.path.startsWith('/admin');
  const isPendingPage = to.path === '/app/pending';

  // Protecting /admin/** routes (requires role == 'admin')
  if (isAdminRoute) {
    if (!user.value) {
      return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }
    if (!isAdmin.value) {
      return navigateTo('/');
    }
  }

  // Protecting /app/** routes (requires distributor_approved or admin)
  if (isAppRoute && !isPendingPage) {
    if (!user.value) {
      return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }

    if (isPendingDistributor.value) {
      return navigateTo('/app/pending');
    }

    if (!isApprovedDistributor.value && !isAdmin.value) {
      return navigateTo('/');
    }
  }

  // If pending distributor visits /app/pending, allow access
  if (isPendingPage && !user.value) {
    return navigateTo('/auth/login');
  }
});
