import type { Product, CartItem } from '~/types';

export const useB2BCart = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const items = useState<CartItem[]>('b2b_cart_items', () => []);
  const isInitialized = useState<boolean>('b2b_cart_initialized', () => false);

  // Initialize cart from localStorage on client side
  onMounted(() => {
    if (import.meta.client && !isInitialized.value) {
      try {
        const saved = localStorage.getItem('manpa_b2b_cart');
        if (saved) {
          items.value = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load cart from storage:', e);
      } finally {
        isInitialized.value = true;
      }
    }
  });

  // Watch items and sync to localStorage
  watch(
    items,
    (newItems) => {
      if (import.meta.client) {
        localStorage.setItem('manpa_b2b_cart', JSON.stringify(newItems));
      }
    },
    { deep: true }
  );

  /**
   * Calculates the exact unit price considering MOQ steps, custom lists, and volume tier discounts
   */
  const resolveUnitPrice = async (product: Product, quantity: number): Promise<number> => {
    // If authenticated, attempt to fetch authoritative price from Supabase RPC
    if (user.value) {
      try {
        const { data, error } = await supabase.rpc('get_effective_product_price', {
          p_product_id: product.id,
          p_user_id: user.value.id,
          p_qty: quantity,
        });

        if (!error && typeof data === 'number') {
          return data;
        }
      } catch (err) {
        console.warn('RPC price calculation failed, resorting to client fallback:', err);
      }
    }

    // Client-side fallback calculation based on product base_price and tiers
    let unitPrice = product.base_price;

    if (product.tiers && product.tiers.length > 0) {
      // Find highest tier matched by quantity
      const applicableTier = [...product.tiers]
        .sort((a, b) => b.min_quantity - a.min_quantity)
        .find((t) => quantity >= t.min_quantity);

      if (applicableTier) {
        unitPrice = unitPrice * (1 - applicableTier.discount_percentage / 100);
      }
    }

    return Number(unitPrice.toFixed(2));
  };

  /**
   * Helper to round quantity to valid MOQ and step increment
   */
  const normalizeQuantity = (product: Product, rawQty: number): number => {
    const moq = product.min_order_qty || 1;
    const step = product.qty_step || 1;

    if (rawQty <= moq) {
      return moq;
    }

    // Round up to nearest valid step multiple after MOQ
    const diff = rawQty - moq;
    const stepsCount = Math.round(diff / step);
    return moq + stepsCount * step;
  };

  /**
   * Add a product to the cart with proper step and MOQ validation
   */
  const addToCart = async (product: Product, requestedQty?: number) => {
    const initialQty = normalizeQuantity(product, requestedQty || product.min_order_qty);

    const existingIndex = items.value.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const currentItem = items.value[existingIndex];
      const newQty = normalizeQuantity(product, currentItem.quantity + (product.qty_step || 1));
      const unitPrice = await resolveUnitPrice(product, newQty);

      items.value[existingIndex] = {
        product,
        quantity: newQty,
        unit_price: unitPrice,
        subtotal: Number((newQty * unitPrice).toFixed(2)),
      };
    } else {
      const unitPrice = await resolveUnitPrice(product, initialQty);
      items.value.push({
        product,
        quantity: initialQty,
        unit_price: unitPrice,
        subtotal: Number((initialQty * unitPrice).toFixed(2)),
      });
    }
  };

  /**
   * Update item quantity directly while maintaining step & MOQ locking
   */
  const updateQuantity = async (productId: string, rawQty: number) => {
    const index = items.value.findIndex((item) => item.product.id === productId);
    if (index === -1) return;

    const item = items.value[index];
    const validQty = normalizeQuantity(item.product, rawQty);
    const unitPrice = await resolveUnitPrice(item.product, validQty);

    items.value[index] = {
      ...item,
      quantity: validQty,
      unit_price: unitPrice,
      subtotal: Number((validQty * unitPrice).toFixed(2)),
    };
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (productId: string) => {
    items.value = items.value.filter((item) => item.product.id !== productId);
  };

  /**
   * Clear whole cart
   */
  const clearCart = () => {
    items.value = [];
  };

  // Computed cart metrics
  const totalItemCount = computed(() =>
    items.value.reduce((acc, item) => acc + item.quantity, 0)
  );

  const subtotal = computed(() =>
    Number(items.value.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2))
  );

  const taxAmount = computed(() => Number((subtotal.value * 0.16).toFixed(2))); // 16% IVA

  const grandTotal = computed(() => Number((subtotal.value + taxAmount.value).toFixed(2)));

  return {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    normalizeQuantity,
    resolveUnitPrice,
    totalItemCount,
    subtotal,
    taxAmount,
    grandTotal,
  };
};
