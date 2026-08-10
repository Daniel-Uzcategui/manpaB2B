<template>
  <div class="min-h-screen py-16 px-4 flex items-center justify-center">
    <div class="glass-panel w-full max-w-md p-8 space-y-6 border border-slate-800 relative">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg shadow-brand-600/30">
          M
        </div>
        <h1 class="text-2xl font-extrabold text-white">Acceso Mayorista MANPA</h1>
        <p class="text-slate-400 text-xs">Ingresa con tus credenciales de distribuidor corporativo.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Correo Corporativo</label>
          <input
            v-model="email"
            type="email"
            class="glass-input w-full text-sm"
            placeholder="ejemplo@empresa.com"
            required
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            class="glass-input w-full text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="errorMessage" class="text-xs text-rose-400 font-semibold text-center">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <span>{{ loading ? 'Iniciando Sesión...' : 'Ingresar al Portal' }}</span>
        </button>
      </form>

      <div class="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        ¿Aún no tienes cuenta corporativa?
        <NuxtLink to="/auth/register" class="text-brand-400 font-bold hover:underline">
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

const supabase = useSupabaseClient();
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

    const { error } = await supabase.auth.signInWithPassword({
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
