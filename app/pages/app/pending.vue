<template>
  <div class="min-h-screen py-16 px-4 flex items-center justify-center bg-[#F7F9FB]">
    <div class="purity-card w-full max-w-lg p-10 text-center space-y-6 bg-white border border-[#E2E8F0] shadow-xl">
      <div class="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200 shadow-inner">
        <Clock class="w-8 h-8 animate-pulse" />
      </div>

      <div class="space-y-2">
        <span class="purity-chip">Estatus: En Revisión</span>
        <h1 class="text-2xl font-extrabold text-brand-900">Solicitud B2B en Evaluación</h1>
        <p class="text-slate-600 text-xs leading-relaxed max-w-md mx-auto">
          Gracias por registrar tu empresa. Tu comprobante de RIF y Registro Mercantil están siendo revisados por la gerencia comercial de MANPA.
        </p>
      </div>

      <div class="purity-card p-4 bg-slate-50 text-left text-xs space-y-2 font-mono text-slate-700">
        <div><strong>Empresa:</strong> {{ company?.legal_name || 'En proceso' }}</div>
        <div><strong>Contacto:</strong> {{ profile?.full_name }}</div>
        <div><strong>RIF:</strong> {{ company?.tax_id || 'En proceso' }}</div>
      </div>

      <div class="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3">
        <NuxtLink to="/catalog" class="btn-secondary w-full py-2.5 text-xs justify-center">
          Explorar Catálogo sin Precios
        </NuxtLink>
        <button @click="logout" class="btn-primary w-full py-2.5 text-xs justify-center">
          Cerrar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock } from 'lucide-vue-next';

const { profile, company, logout } = useB2BAuth();
</script>
