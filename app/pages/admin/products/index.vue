<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-widest">
          <Package class="w-4 h-4" />
          <span>Administración Manpa</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white mt-1">Gestión de Catálogo & Precios Base</h1>
        <p class="text-slate-400 text-sm mt-1">
          Administra SKU, precios base, empaques mínimos (MOQ) e incrementos de paquete.
        </p>
      </div>

      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all"
      >
        <Plus class="w-5 h-5" />
        <span>Nuevo Producto</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <!-- Products Table -->
    <div v-else-if="products.length > 0" class="glass-panel border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">SKU / Producto</th>
              <th class="px-6 py-4">Categoría</th>
              <th class="px-6 py-4">Stock</th>
              <th class="px-6 py-4">MOQ (Mínimo)</th>
              <th class="px-6 py-4">Incremento (Step)</th>
              <th class="px-6 py-4 text-right">Precio Base (USD)</th>
              <th class="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="prod in products" :key="prod.id" class="hover:bg-slate-900/60 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img :src="prod.images[0]" class="w-10 h-10 rounded-lg object-cover bg-slate-900" />
                  <div>
                    <span class="font-bold text-white text-sm block line-clamp-1">{{ prod.name }}</span>
                    <span class="text-[10px] font-mono text-brand-400 font-bold">SKU: {{ prod.sku }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-300 font-semibold uppercase">{{ prod.category }}</td>
              <td class="px-6 py-4">
                <span :class="prod.stock > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'">
                  {{ prod.stock }} ud
                </span>
              </td>
              <td class="px-6 py-4 text-slate-200 font-bold">{{ prod.min_order_qty }} ud</td>
              <td class="px-6 py-4 text-brand-400 font-bold">+{{ prod.qty_step }} ud</td>
              <td class="px-6 py-4 text-right font-bold text-white text-sm">${{ prod.base_price }}</td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openModal(prod)"
                    class="p-2 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-lg p-6 space-y-6 border border-slate-800 relative">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-xl font-bold text-white">{{ editingId ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white">
            <X class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="saveProduct" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU *</label>
              <input v-model="form.sku" type="text" class="glass-input w-full" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Categoría *</label>
              <input v-model="form.category" type="text" class="glass-input w-full" required />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Nombre del Producto *</label>
            <input v-model="form.name" type="text" class="glass-input w-full" required />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Precio Base (USD) *</label>
              <input v-model.number="form.base_price" type="number" step="0.01" class="glass-input w-full" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">MOQ (Mínimo) *</label>
              <input v-model.number="form.min_order_qty" type="number" min="1" class="glass-input w-full" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Step (+Empaque) *</label>
              <input v-model.number="form.qty_step" type="number" min="1" class="glass-input w-full" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Stock Disponible</label>
              <input v-model.number="form.stock" type="number" min="0" class="glass-input w-full" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Imagen URL</label>
              <input v-model="imageUrl" type="url" class="glass-input w-full" />
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" @click="showModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/20">Guardar Producto</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Package, Plus, Loader2, Pencil, X } from 'lucide-vue-next';
import type { Product } from '~/types';

definePageMeta({
  middleware: 'auth-global',
});

const supabase = useSupabaseClient();
const products = ref<Product[]>([]);
const loading = ref(true);
const showModal = ref(false);
const editingId = ref<string | null>(null);
const imageUrl = ref('');

const form = ref({
  sku: '',
  name: '',
  slug: '',
  category: 'Institucional',
  base_price: 0,
  min_order_qty: 12,
  qty_step: 12,
  stock: 1000,
  is_active: true,
});

const fetchProducts = async () => {
  try {
    loading.value = true;
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) products.value = data as Product[];
  } catch (err) {
    console.error('Error fetching products:', err);
  } finally {
    loading.value = false;
  }
};

const openModal = (prod?: Product) => {
  if (prod) {
    editingId.value = prod.id;
    form.value = {
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      category: prod.category,
      base_price: prod.base_price,
      min_order_qty: prod.min_order_qty,
      qty_step: prod.qty_step,
      stock: prod.stock,
      is_active: prod.is_active,
    };
    imageUrl.value = prod.images[0] || '';
  } else {
    editingId.value = null;
    form.value = {
      sku: '',
      name: '',
      slug: '',
      category: 'Institucional',
      base_price: 25.0,
      min_order_qty: 12,
      qty_step: 12,
      stock: 500,
      is_active: true,
    };
    imageUrl.value = 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80';
  }
  showModal.value = true;
};

const saveProduct = async () => {
  const payload = {
    ...form.value,
    slug: form.value.slug || form.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    images: [imageUrl.value],
  };

  if (editingId.value) {
    await supabase.from('products').update(payload).eq('id', editingId.value);
  } else {
    await supabase.from('products').insert([payload]);
  }
  showModal.value = false;
  await fetchProducts();
};

onMounted(() => {
  fetchProducts();
});
</script>
