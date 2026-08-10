<template>
  <div class="flex flex-col gap-1.5 select-none">
    <div class="inline-flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1 shadow-inner">
      <!-- Decrement Button -->
      <button
        type="button"
        @click="decrement"
        :disabled="modelValue <= minQty || disabled"
        class="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg"
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
          class="w-full bg-transparent text-center text-white font-bold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      <!-- Increment Button -->
      <button
        type="button"
        @click="increment"
        :disabled="disabled"
        class="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg shadow-md shadow-brand-600/20"
        title="Incrementar empaque"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <!-- Step & MOQ Helper Badge -->
    <div class="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
      <span>Mínimo: <strong class="text-slate-200">{{ minQty }}</strong></span>
      <span>Empaque: <strong class="text-brand-400">+{{ step }} ud</strong></span>
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
