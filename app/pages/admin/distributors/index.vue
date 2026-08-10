<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#F7F9FB] min-h-screen">
    <div class="purity-card p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="purity-chip">Panel Administrativo MANPA</span>
          <span class="bg-accent-50 text-accent-600 border border-accent-200 px-2 py-0.5 rounded text-[10px] font-bold">Admin Level</span>
        </div>
        <h1 class="text-3xl font-extrabold text-brand-900">Aprobación de Distribuidores</h1>
        <p class="text-xs text-slate-500">Evalúa documentos PDF fiscales y asigna límites de crédito a nuevos clientes corporativos.</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="filterRole = 'distributor_pending'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all',
            filterRole === 'distributor_pending' ? 'bg-accent-500 text-white' : 'bg-slate-100 text-slate-700'
          ]"
        >
          Pendientes por Aprobar
        </button>
        <button
          @click="filterRole = 'distributor_approved'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all',
            filterRole === 'distributor_approved' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
          ]"
        >
          Aprobados
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="w-10 h-10 text-brand-600 animate-spin" />
    </div>

    <!-- Distributors List -->
    <div v-else-if="filteredDistributors.length === 0" class="purity-card p-12 text-center bg-white space-y-3">
      <Building2 class="w-12 h-12 text-slate-300 mx-auto" />
      <h3 class="font-bold text-brand-900">No hay distribuidores en esta categoría</h3>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="dist in filteredDistributors"
        :key="dist.id"
        class="purity-card p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2 max-w-xl">
          <div class="flex items-center gap-3">
            <h3 class="font-extrabold text-brand-900 text-lg">
              {{ dist.company?.legal_name || dist.full_name }}
            </h3>
            <B2BStatusBadge :status="dist.role" />
          </div>

          <p class="text-xs text-slate-600 font-mono">
            RIF: <strong>{{ dist.company?.tax_id }}</strong> | Contacto: {{ dist.full_name }} ({{ dist.company?.phone }})
          </p>

          <div class="flex items-center gap-4 text-xs pt-1">
            <a
              v-if="dist.tax_doc_url"
              :href="dist.tax_doc_url"
              target="_blank"
              class="text-brand-600 font-bold hover:underline flex items-center gap-1"
            >
              <FileText class="w-4 h-4" /> Ver PDF RIF
            </a>
            <a
              v-if="dist.mercantile_doc_url"
              :href="dist.mercantile_doc_url"
              target="_blank"
              class="text-brand-600 font-bold hover:underline flex items-center gap-1"
            >
              <FileText class="w-4 h-4" /> Ver PDF Reg. Mercantil
            </a>
          </div>
        </div>

        <!-- Approval Actions Form -->
        <div v-if="dist.role === 'distributor_pending'" class="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-4 rounded-xl border border-[#E2E8F0]">
          <div class="w-36">
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Límite Crédito ($)</label>
            <input
              type="number"
              v-model="creditLimits[dist.id]"
              class="purity-input w-full text-xs"
              placeholder="50000"
            />
          </div>

          <button
            @click="approveDistributor(dist.id)"
            :disabled="approving[dist.id]"
            class="btn-primary py-2.5 px-4 text-xs shrink-0"
          >
            <CheckCircle class="w-4 h-4" />
            <span>Aprobar Distribuidor</span>
          </button>
        </div>

        <div v-else class="text-right text-xs font-mono">
          <span class="text-slate-400 block uppercase text-[10px]">Límite Aprobado</span>
          <span class="font-black text-brand-900 text-base">${{ (dist.company?.credit_limit || 0).toLocaleString() }} USD</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Loader2, Building2, FileText, CheckCircle } from 'lucide-vue-next';

const supabase = useB2BSupabaseClient();

const distributors = ref<any[]>([]);
const filterRole = ref('distributor_pending');
const loading = ref(true);
const creditLimits = ref<Record<string, number>>({});
const approving = ref<Record<string, boolean>>({});

const fetchDistributors = async () => {
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .in('role', ['distributor_pending', 'distributor_approved'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      distributors.value = data;
      data.forEach((d) => {
        creditLimits.value[d.id] = d.company?.credit_limit || 50000;
      });
    }
  } catch (err) {
    console.error('Error fetching distributors:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDistributors();
});

const filteredDistributors = computed(() => {
  return distributors.value.filter((d) => d.role === filterRole.value);
});

const approveDistributor = async (profileId: string) => {
  try {
    approving.value[profileId] = true;
    const credit = creditLimits.value[profileId] || 50000;

    const res = await $fetch('/api/auth/approve-distributor', {
      method: 'POST',
      body: {
        profileId,
        creditLimit: credit,
      },
    });

    if (res && res.success) {
      await fetchDistributors();
    }
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Error al aprobar distribuidor.');
  } finally {
    approving.value[profileId] = false;
  }
};
</script>
