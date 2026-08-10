<template>
  <div class="min-h-screen py-16 px-4 flex items-center justify-center bg-[#F7F9FB]">
    <div class="purity-card w-full max-w-2xl p-8 sm:p-10 space-y-8 border border-[#E2E8F0] shadow-xl relative bg-white">
      <div class="text-center space-y-2">
        <span class="purity-chip">Solicitud de Registro B2B</span>
        <h1 class="text-3xl font-extrabold text-brand-900 mt-2">Alta de Empresa Distribuidora</h1>
        <p class="text-slate-500 text-xs font-medium">Completa la información fiscal y adjunta tus documentos en PDF para ser evaluado por nuestro departamento de ventas.</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <!-- Company Information -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-brand-900 uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
            1. Datos de la Empresa
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social <span class="text-accent-500">*</span></label>
              <input v-model="legalName" type="text" class="purity-input w-full" placeholder="Ej: Distribuidora Papelera C.A." required />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">RIF / NIT <span class="text-accent-500">*</span></label>
              <input v-model="taxId" type="text" class="purity-input w-full" placeholder="J-12345678-0" required />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Persona de Contacto <span class="text-accent-500">*</span></label>
              <input v-model="contactPerson" type="text" class="purity-input w-full" placeholder="Nombre completo" required />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono Corporativo <span class="text-accent-500">*</span></label>
              <input v-model="phone" type="tel" class="purity-input w-full" placeholder="+58 414 0000000" required />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección Fiscal / Almacén <span class="text-accent-500">*</span></label>
            <textarea v-model="address" rows="2" class="purity-input w-full" placeholder="Dirección completa del depósito..." required></textarea>
          </div>
        </div>

        <!-- Mandatory PDF Document Uploads -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-brand-900 uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
            2. Documentación Obligatoria (PDF)
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <B2BDocumentUploader
              label="Comprobante de RIF (PDF)"
              v-model="taxDocUrl"
              bucket="registration-docs"
              :required="true"
            />

            <B2BDocumentUploader
              label="Registro Mercantil (PDF)"
              v-model="mercantileDocUrl"
              bucket="registration-docs"
              :required="true"
            />
          </div>
        </div>

        <!-- Account User Auth Info -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-brand-900 uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
            3. Datos de Acceso
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico <span class="text-accent-500">*</span></label>
              <input v-model="email" type="email" class="purity-input w-full" placeholder="compras@empresa.com" required />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña <span class="text-accent-500">*</span></label>
              <input v-model="password" type="password" class="purity-input w-full" placeholder="••••••••" required />
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="text-xs text-accent-600 font-semibold text-center bg-accent-50 p-2.5 rounded-lg border border-accent-200">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary py-4 text-base"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <span>{{ loading ? 'Enviando Solicitud...' : 'Enviar Solicitud de Registro B2B' }}</span>
        </button>
      </form>

      <div class="pt-4 border-t border-[#E2E8F0] text-center text-xs text-slate-600">
        ¿Ya tienes cuenta aprobada?
        <NuxtLink to="/auth/login" class="text-brand-600 font-bold hover:underline ml-1">
          Iniciar Sesión
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Loader2 } from 'lucide-vue-next';

const supabase = useB2BSupabaseClient();
const { fetchProfile } = useB2BAuth();

// Form fields
const legalName = ref('');
const taxId = ref('');
const contactPerson = ref('');
const phone = ref('');
const address = ref('');
const taxDocUrl = ref('');
const mercantileDocUrl = ref('');
const email = ref('');
const password = ref('');

const loading = ref(false);
const errorMessage = ref('');

const handleRegister = async () => {
  if (!taxDocUrl.value || !mercantileDocUrl.value) {
    errorMessage.value = 'Debes adjuntar obligatoriamente el RIF y el Registro Mercantil en formato PDF.';
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';

    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: contactPerson.value,
        },
      },
    });

    if (authError || !authData.user) {
      throw authError || new Error('Error al registrar usuario.');
    }

    const userId = authData.user.id;

    // 2. Insert Company Record
    const { data: compData, error: compError } = await supabase
      .from('companies')
      .insert([
        {
          legal_name: legalName.value,
          tax_id: taxId.value,
          phone: phone.value,
          contact_person: contactPerson.value,
          address: address.value,
        },
      ])
      .select()
      .single();

    if (compError || !compData) {
      throw compError || new Error('Error al guardar datos de la empresa.');
    }

    // 3. Insert Profile Record with role distributor_pending
    const { error: profError } = await supabase.from('profiles').insert([
      {
        id: userId,
        company_id: compData.id,
        full_name: contactPerson.value,
        role: 'distributor_pending',
        tax_doc_url: taxDocUrl.value,
        mercantile_doc_url: mercantileDocUrl.value,
      },
    ]);

    if (profError) {
      throw profError;
    }

    await fetchProfile();
    navigateTo('/app/pending');
  } catch (err: any) {
    console.error('Registration error:', err);
    errorMessage.value = err.message || 'Error durante el registro corporativo.';
  } finally {
    loading.value = false;
  }
};
</script>
