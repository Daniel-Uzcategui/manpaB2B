<template>
  <div class="purity-card bg-white overflow-hidden flex flex-col h-[520px] border border-[#E2E8F0] shadow-lg">
    <!-- Chat Header -->
    <div class="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <MessageSquare class="w-5 h-5 text-brand-600" />
        <h3 class="font-bold text-brand-900 text-sm">Canal Directo de Comunicación B2B</h3>
      </div>
      <span class="text-[10px] font-mono font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded border border-brand-200">
        En Vivo
      </span>
    </div>

    <!-- Messages Container -->
    <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F9FB]">
      <div v-if="loading" class="flex justify-center py-8">
        <Loader2 class="w-6 h-6 text-brand-600 animate-spin" />
      </div>

      <div v-else-if="messages.length === 0" class="text-center py-12 text-slate-400 space-y-2">
        <MessageSquare class="w-10 h-10 mx-auto text-slate-300" />
        <p class="text-xs font-semibold">No hay mensajes en este pedido. Envía una consulta a la gerencia de MANPA.</p>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="[
          'max-w-[80%] rounded-xl p-3.5 space-y-1 text-xs shadow-sm',
          msg.sender_id === user?.id
            ? 'ml-auto bg-brand-600 text-white rounded-br-none'
            : 'bg-white text-slate-800 border border-[#E2E8F0] rounded-bl-none'
        ]"
      >
        <div class="flex items-center justify-between gap-4 text-[10px] opacity-80 border-b border-white/20 pb-1">
          <span class="font-bold">{{ msg.sender_name }}</span>
          <span class="font-mono">{{ new Date(msg.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
        <p class="leading-relaxed whitespace-pre-wrap pt-1 font-medium">{{ msg.content }}</p>
      </div>
    </div>

    <!-- Input Bar -->
    <form @submit.prevent="handleSend" class="p-3 bg-white border-t border-[#E2E8F0] flex gap-2">
      <input
        v-model="inputContent"
        type="text"
        placeholder="Escribe un mensaje o aclaratoria..."
        class="purity-input flex-1"
        required
      />
      <button
        type="submit"
        :disabled="sending"
        class="btn-primary py-2 px-4"
      >
        <Send class="w-4 h-4" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MessageSquare, Loader2, Send } from 'lucide-vue-next';

const props = defineProps({
  orderId: { type: String, required: true },
});

const { user } = useB2BAuth();
const { messages, loading, sendMessage } = useRealtimeChat(props.orderId);

const inputContent = ref('');
const sending = ref(false);

const handleSend = async () => {
  if (!inputContent.value.trim() || !user.value) return;

  try {
    sending.value = true;
    await sendMessage(inputContent.value, user.value.id);
    inputContent.value = '';
  } catch (err) {
    console.error('Error sending message:', err);
  } finally {
    sending.value = false;
  }
};
</script>
