import type { Message } from '~/types';

export const useRealtimeChat = (orderId: string) => {
  const supabase = useB2BSupabaseClient();
  const messages = ref<Message[]>([]);
  const loading = ref(true);
  let channel: any = null;

  const fetchMessages = async () => {
    try {
      loading.value = true;
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(full_name)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        messages.value = data.map((m: any) => ({
          ...m,
          sender_name: m.sender?.full_name || 'Usuario',
        }));
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      loading.value = false;
    }
  };

  const subscribe = () => {
    channel = supabase
      .channel(`order_chat_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch sender details
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single();

          newMsg.sender_name = prof?.full_name || 'Usuario';
          messages.value.push(newMsg);
        }
      )
      .subscribe();
  };

  const sendMessage = async (content: string, senderId: string, isSupportTicket = false) => {
    if (!content.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          order_id: orderId,
          sender_id: senderId,
          content: content.trim(),
          is_support_ticket: isSupportTicket,
        },
      ]);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  const unsubscribe = () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };

  onMounted(() => {
    fetchMessages();
    subscribe();
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages,
  };
};
