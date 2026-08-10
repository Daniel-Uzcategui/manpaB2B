<template>
  <div class="glass-panel flex flex-col h-[500px] border border-slate-800 overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
        <h3 class="font-bold text-white text-base">Chat Directo de Pedido</h3>
      </div>
      <span class="text-xs font-mono text-slate-400">Canal Realtime</span>
    </div>

    <!-- Messages List -->
    <div ref="chatContainer" class="flex-1 p-4 overflow-y-auto space-y-3">
      <div v-if="loading" class="flex justify-center py-10">
        <Loader2 class="w-6 h-6 text-brand-400 animate-spin" />
      </div>

      <template v-else-if="messages.length > 0">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'flex flex-col max-w-[80%]',
            msg.sender_id === currentUserId ? 'ml-auto items-end' : 'mr-auto items-start'
          ]"
        >
          <span class="text-[10px] font-semibold text-slate-400 mb-1 px-1">
            {{ msg.sender_name }} • {{ formatTime(msg.created_at) }}
          </span>

          <div
            :class="[
              'p-3.5 rounded-2xl text-sm leading-relaxed shadow-md',
              msg.sender_id === currentUserId
                ? 'bg-brand-600 text-white rounded-br-none'
                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80'
            ]"
          >
            {{ msg.content }}
          </div>
        </div>
      </template>

      <div v-else class="text-center py-12 text-slate-500 text-sm">
        No hay mensajes en esta orden. Escribe una consulta para iniciar el chat con el soporte Manpa.
      </div>
    </div>

    <!-- Input Form -->
    <form @submit.prevent="handleSend" class="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
      <input
        v-model="inputContent"
        type="text"
        placeholder="Escribe un mensaje..."
        class="glass-input flex-1 text-sm"
        :disabled="sending"
      />
      <button
        type="submit"
        :disabled="!inputContent.trim() || sending"
        class="px-4 rounded-xl bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 font-bold transition-all flex items-center justify-center shadow-lg shadow-brand-600/20"
      >
        <Send class="w-4 h-4" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { Loader2, Send } from 'lucide-vue-next';

const props = defineProps({
  orderId: {
    type: String,
    required: true,
  },
  currentUserId: {
    type: String,
    required: true,
  },
});

const { messages, loading, sendMessage } = useRealtimeChat(props.orderId);
const inputContent = ref('');
const sending = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

watch(messages, () => {
  scrollToBottom();
}, { deep: true });

const handleSend = async () => {
  if (!inputContent.value.trim()) return;
  sending.value = true;
  await sendMessage(inputContent.value, props.currentUserId);
  inputContent.value = '';
  sending.value = false;
  scrollToBottom();
};

const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>
