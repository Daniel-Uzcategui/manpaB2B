<template>
  <div class="min-h-screen py-16 px-4 flex items-center justify-center bg-[#F7F9FB]">
    <div class="purity-card w-full max-w-md p-8 sm:p-10 space-y-6 border border-[#E2E8F0] shadow-xl relative bg-white">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center font-black text-white text-xl mx-auto shadow-md">
          M
        </div>
        <h1 class="text-2xl font-extrabold text-brand-900">Acceso Mayorista MANPA</h1>
        <p class="text-slate-500 text-xs font-medium">Ingresa con tus credenciales de distribuidor corporativo.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Corporativo</label>
          <input
            v-model="email"
            type="email"
            class="purity-input w-full"
            placeholder="ejemplo@empresa.com"
            required
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            class="purity-input w-full"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="errorMessage" class="text-xs text-accent-600 font-semibold text-center bg-accent-50 p-2.5 rounded-lg border border-accent-200">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary py-3.5"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <span>{{ loading ? 'Iniciando Sesión...' : 'Ingresar al Portal B2B' }}</span>
        </button>
      </form>

      <div class="pt-4 border-t border-[#E2E8F0] text-center text-xs text-slate-600">
        ¿Aún no tienes cuenta corporativa?
        <NuxtLink to="/auth/register" class="text-brand-600 font-bold hover:underline ml-1">
          Solicitar Registro Mayorista
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Loader2 } from 'lucide-vue-next';

const supabase = useB2BSupabaseClient();
const route = useRoute();
const { fetchProfile, profile } = useB2BAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      throw error;
    }

    await fetchProfile();

    const redirectPath = (route.query.redirect as string) || (profile.value?.role === 'admin' ? '/admin/distributors' : '/app/dashboard');
    navigateTo(redirectPath);
  } catch (err: any) {
    console.error('Login error:', err);
    errorMessage.value = err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.';
  } finally {
    loading.value = false;
  }
};
</script>
