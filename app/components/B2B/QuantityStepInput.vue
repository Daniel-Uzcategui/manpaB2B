<template>
  <div class="flex flex-col gap-1.5 select-none">
    <div class="inline-flex items-center rounded-lg bg-slate-50 border-2 border-[#E2E8F0] p-1 shadow-inner">
      <!-- Decrement Button -->
      <button
        type="button"
        @click="decrement"
        :disabled="modelValue <= minQty || disabled"
        class="w-9 h-9 flex items-center justify-center rounded-md bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-100 hover:text-brand-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-base shadow-sm"
        title="Decrementar empaque"
      >
        <Minus class="w-4 h-4" />
      </button>

      <!-- Quantity Number Display / Input -->
      <div class="flex-1 px-3 text-center">
        <input
          type="number"
          :value="modelValue"
          @blur="onBlur"
          @keydown.enter="onBlur"
          :disabled="disabled"
          class="w-full bg-transparent text-center text-brand-900 font-extrabold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      <!-- Increment Button -->
      <button
        type="button"
        @click="increment"
        :disabled="disabled"
        class="w-9 h-9 flex items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-base shadow-sm"
        title="Incrementar empaque"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <!-- Step & MOQ Helper Badge -->
    <div class="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
      <span>Mínimo: <strong class="text-brand-900">{{ minQty }}</strong></span>
      <span>Empaque: <strong class="text-brand-600">+{{ step }} ud</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Minus } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  minQty: {
    type: Number,
    default: 1,
  },
  step: {
    type: Number,
    default: 1,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const increment = () => {
  const nextVal = props.modelValue + props.step;
  emit('update:modelValue', nextVal);
  emit('change', nextVal);
};

const decrement = () => {
  if (props.modelValue - props.step >= props.minQty) {
    const nextVal = props.modelValue - props.step;
    emit('update:modelValue', nextVal);
    emit('change', nextVal);
  } else if (props.modelValue > props.minQty) {
    emit('update:modelValue', props.minQty);
    emit('change', props.minQty);
  }
};

const onBlur = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let val = parseInt(input.value, 10);

  if (isNaN(val) || val < props.minQty) {
    val = props.minQty;
  } else {
    // Round to valid step
    const diff = val - props.minQty;
    const steps = Math.round(diff / props.step);
    val = props.minQty + steps * props.step;
  }

  input.value = val.toString();
  emit('update:modelValue', val);
  emit('change', val);
};
</script>
