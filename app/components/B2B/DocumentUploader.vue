<template>
  <div class="flex flex-col gap-2">
    <label class="block text-sm font-medium text-slate-300">
      {{ label }} <span v-if="required" class="text-rose-500">*</span>
    </label>

    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer',
        isDragging ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60',
        uploadedUrl ? 'border-emerald-500/50 bg-emerald-500/5' : ''
      ]"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Success State -->
      <template v-if="uploadedUrl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-emerald-300 truncate max-w-[200px]">
              {{ fileName || 'Documento PDF Cargado' }}
            </p>
            <p class="text-xs text-slate-400">Clic para cambiar archivo PDF</p>
          </div>
        </div>
      </template>

      <!-- Uploading State -->
      <template v-else-if="uploading">
        <div class="flex flex-col items-center gap-2 py-2">
          <Loader2 class="w-8 h-8 text-brand-400 animate-spin" />
          <span class="text-xs font-medium text-slate-300">Subiendo a servidor seguro...</span>
        </div>
      </template>

      <!-- Empty Default State -->
      <template v-else>
        <FileText class="w-8 h-8 text-slate-500 mb-2" />
        <p class="text-sm text-slate-300 font-medium">
          Arrastra tu PDF aquí o <span class="text-brand-400 hover:underline">examina tu equipo</span>
        </p>
        <p class="text-xs text-slate-500 mt-1">Formato PDF obligatorio (Máx 10 MB)</p>
      </template>
    </div>

    <!-- Error message display -->
    <p v-if="errorMessage" class="text-xs text-rose-400 flex items-center gap-1 font-medium">
      <AlertCircle class="w-3.5 h-3.5" /> {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  label: {
    type: Number || String,
    required: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
  bucket: {
    type: String,
    default: 'registration-docs',
  },
  required: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'uploaded']);

const supabase = useSupabaseClient();
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadedUrl = ref(props.modelValue);
const fileName = ref('');
const errorMessage = ref('');

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const processFile = async (file: File) => {
  errorMessage.value = '';

  if (file.type !== 'application/pdf') {
    errorMessage.value = 'El archivo debe ser en formato PDF obligatorio.';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = 'El archivo excede el tamaño máximo permitido de 10 MB.';
    return;
  }

  try {
    uploading.value = true;
    fileName.value = file.name;

    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(props.bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(props.bucket)
      .getPublicUrl(filePath);

    const finalUrl = publicUrlData.publicUrl;
    uploadedUrl.value = finalUrl;
    emit('update:modelValue', finalUrl);
    emit('uploaded', finalUrl);
  } catch (err: any) {
    console.error('File upload error:', err);
    errorMessage.value = err.message || 'Error al subir el documento.';
  } finally {
    uploading.value = false;
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFile(target.files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0]);
  }
};
</script>
