<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest">
          <ShieldCheck class="w-4 h-4" />
          <span>Administración Manpa</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white mt-1">Solicitudes de Distribuidores</h1>
        <p class="text-slate-400 text-sm mt-1">
          Revisa la documentación fiscal en PDF y aprueba nuevas cuentas mayoristas.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <select v-model="roleFilter" class="glass-input text-xs">
          <option value="distributor_pending">Pendientes de Evaluación</option>
          <option value="distributor_approved">Aprobados</option>
          <option value="distributor_rejected">Rechazados</option>
          <option value="all">Todos los Registros</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <!-- Distributors Table -->
    <div v-else-if="filteredProfiles.length > 0" class="glass-panel border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">Empresa / Razón Social</th>
              <th class="px-6 py-4">RIF / NIT</th>
              <th class="px-6 py-4">Representante</th>
              <th class="px-6 py-4">Documentos PDF</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="prof in filteredProfiles" :key="prof.id" class="hover:bg-slate-900/60 transition-colors">
              <td class="px-6 py-4">
                <span class="font-bold text-white text-sm block">{{ prof.company?.legal_name || 'Sin Razón Social' }}</span>
                <span class="text-[10px] text-slate-400">{{ prof.company?.phone }} • {{ prof.company?.address }}</span>
              </td>
              <td class="px-6 py-4 font-mono font-bold text-brand-400">{{ prof.company?.tax_id }}</td>
              <td class="px-6 py-4 text-slate-200">{{ prof.full_name }}</td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <a
                    v-if="prof.tax_doc_url"
                    :href="prof.tax_doc_url"
                    target="_blank"
                    class="text-[11px] font-bold text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    <span>Ver RIF PDF</span>
                  </a>
                  <a
                    v-if="prof.mercantile_doc_url"
                    :href="prof.mercantile_doc_url"
                    target="_blank"
                    class="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    <span>Ver Registro Mercantil</span>
                  </a>
                </div>
              </td>
              <td class="px-6 py-4">
                <UIStatusBadge :status="prof.role" />
              </td>
              <td class="px-6 py-4 text-center">
                <template v-if="prof.role === 'distributor_pending'">
                  <button
                    @click="approveDistributor(prof.id)"
                    :disabled="processingId === prof.id"
                    class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Loader2 v-if="processingId === prof.id" class="w-3.5 h-3.5 animate-spin" />
                    <CheckCircle2 v-else class="w-3.5 h-3.5" />
                    <span>Aprobar Distribuidor</span>
                  </button>
                </template>
                <template v-else>
                  <span class="text-[11px] text-slate-500 font-mono">Procesado</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel py-20 text-center text-slate-500 text-sm">
      No hay registros que coincidan con el filtro seleccionado.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ShieldCheck, Loader2, FileText, CheckCircle2 } from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth-global',
});

const supabase = useSupabaseClient();
const profiles = ref<any[]>([]);
const loading = ref(true);
const roleFilter = ref('distributor_pending');
const processingId = ref<string | null>(null);

const fetchProfiles = async () => {
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      profiles.value = data;
    }
  } catch (err) {
    console.error('Error loading distributors:', err);
  } finally {
    loading.value = false;
  }
};

const filteredProfiles = computed(() => {
  if (roleFilter.value === 'all') return profiles.value;
  return profiles.value.filter((p) => p.role === roleFilter.value);
});

const approveDistributor = async (profileId: string) => {
  try {
    processingId.value = profileId;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const res = await $fetch<{ success: boolean }>('/api/auth/approve-distributor', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { profileId },
    });

    if (res.success) {
      alert('Distribuidor aprobado exitosamente. Se ha enviado un correo electrónico de bienvenida.');
      await fetchProfiles();
    }
  } catch (err: any) {
    console.error('Approve error:', err);
    alert(err.statusMessage || 'Error al aprobar distribuidor.');
  } finally {
    processingId.value = null;
  }
};

onMounted(() => {
  fetchProfiles();
});
</script>
