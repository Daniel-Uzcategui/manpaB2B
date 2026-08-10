<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      class="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
    >
      <Bell class="w-5 h-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-slate-950 shadow-md animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-3 w-80 sm:w-96 glass-panel border border-slate-800 p-4 shadow-2xl z-50 divide-y divide-slate-800/80"
    >
      <div class="flex items-center justify-between pb-3">
        <h4 class="font-bold text-white text-sm flex items-center gap-2">
          <span>Notificaciones & Mensajes</span>
        </h4>
        <span class="text-[11px] text-slate-400 font-mono">{{ unreadCount }} Sin Leer</span>
      </div>

      <div class="py-3 max-h-72 overflow-y-auto space-y-2">
        <div v-if="notifications.length === 0" class="py-6 text-center text-xs text-slate-500">
          No tienes notificaciones pendientes.
        </div>

        <div
          v-for="item in notifications"
          :key="item.id"
          @click="openNotification(item)"
          class="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-800/60 transition-all cursor-pointer flex gap-3 items-start"
        >
          <div class="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-200 truncate">
              Pedido #{{ item.order_number || item.order_id?.slice(0, 8) }}
            </p>
            <p class="text-xs text-slate-400 line-clamp-1 mt-0.5">{{ item.content }}</p>
            <span class="text-[10px] text-slate-500 font-mono mt-1 block">
              {{ new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>
      </div>

      <div class="pt-3 text-center">
        <NuxtLink
          to="/app/dashboard"
          @click="isOpen = false"
          class="text-xs font-bold text-brand-400 hover:underline"
        >
          Ver Todas las Órdenes →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Bell, MessageSquare } from 'lucide-vue-next';

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const isOpen = ref(false);
const unreadCount = ref(0);
const notifications = ref<any[]>([]);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const fetchUnread = async () => {
  if (!user.value) return;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, order:orders(order_number)')
      .eq('read_by_user', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      notifications.value = data.map((d: any) => ({
        ...d,
        order_number: d.order?.order_number,
      }));
      unreadCount.value = data.length;
    }
  } catch (err) {
    console.error('Error fetching unread notifications:', err);
  }
};

const openNotification = async (item: any) => {
  isOpen.value = false;
  if (item.order_id) {
    navigateTo(`/app/orders/${item.order_id}`);
  }
};

onMounted(() => {
  fetchUnread();
});
</script>
