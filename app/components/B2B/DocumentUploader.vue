<template>
  <div class="space-y-2">
    <label class="block text-xs font-bold text-slate-700 uppercase">
      {{ label }} <span v-if="required" class="text-accent-500">*</span>
    </label>

    <!-- Upload Dropzone Box -->
    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'relative border-2 border-dashed rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-white',
        isDragging ? 'border-brand-600 bg-brand-50' : 'border-[#E2E8F0] hover:border-brand-400 hover:bg-slate-50',
        modelValue ? 'border-emerald-500 bg-emerald-50/30' : ''
      ]"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        class="hidden"
        @change="handleFileSelect"
      />

      <template v-if="uploading">
        <Loader2 class="w-8 h-8 text-brand-600 animate-spin" />
        <span class="text-xs font-semibold text-brand-900">Subiendo documento a servidor...</span>
      </template>

      <template v-else-if="modelValue">
        <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div class="space-y-1">
          <span class="text-xs font-bold text-emerald-800 block">Documento Cargado con Éxito</span>
          <a
            :href="modelValue"
            target="_blank"
            @click.stop
            class="text-[11px] font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
          >
            <FileText class="w-3.5 h-3.5" /> Ver PDF Adjunto
          </a>
        </div>
        <button
          type="button"
          @click.stop="removeFile"
          class="text-[11px] text-accent-600 font-bold hover:underline mt-1"
        >
          Reemplazar Documento
        </button>
      </template>

      <template v-else>
        <div class="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold border border-brand-200">
          <UploadCloud class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs font-bold text-brand-900 block">Haz clic para adjuntar archivo PDF</span>
          <span class="text-[10px] text-slate-400">PDF, JPG o PNG (Máx 10 MB)</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { UploadCloud, CheckCircle2, FileText, Loader2 } from 'lucide-vue-next';

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  bucket: { type: String, default: 'registration-docs' },
  required: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);
const supabase = useB2BSupabaseClient();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploading = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    uploadFile(input.files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    uploadFile(event.dataTransfer.files[0]);
  }
};

const uploadFile = async (file: File) => {
  try {
    uploading.value = true;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from(props.bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadErr) throw uploadErr;

    const { data: publicUrlData } = supabase.storage
      .from(props.bucket)
      .getPublicUrl(filePath);

    emit('update:modelValue', publicUrlData.publicUrl);
  } catch (err: any) {
    console.error('File upload error:', err);
    alert(err.message || 'Error al subir archivo a Supabase Storage.');
  } finally {
    uploading.value = false;
  }
};

const removeFile = () => {
  emit('update:modelValue', '');
};
</script>
