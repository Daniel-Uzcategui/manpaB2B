<template>
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] transition-all shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Brand Logo & Identity -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="w-11 h-11 rounded-lg bg-brand-600 flex items-center justify-center font-black text-white text-xl shadow-md group-hover:bg-brand-700 transition-colors">
            M
          </div>
          <div class="flex flex-col">
            <span class="font-heading font-extrabold text-2xl tracking-tight text-brand-900 leading-none">
              MANPA <span class="text-accent-500">B2B</span>
            </span>
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
              Manufacturas de Papel
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-8">
          <NuxtLink
            to="/"
            class="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors"
            active-class="text-brand-600 font-bold border-b-2 border-brand-600 pb-1"
          >
            Inicio
          </NuxtLink>
          <NuxtLink
            to="/catalog"
            class="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors"
            active-class="text-brand-600 font-bold border-b-2 border-brand-600 pb-1"
          >
            Catálogo al Mayor
          </NuxtLink>

          <template v-if="isApprovedDistributor || isAdmin">
            <NuxtLink
              to="/app/dashboard"
              class="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors"
              active-class="text-brand-600 font-bold border-b-2 border-brand-600 pb-1"
            >
              Portal Distribuidor
            </NuxtLink>
          </template>

          <template v-if="isAdmin">
            <NuxtLink
              to="/admin/distributors"
              class="text-sm font-bold text-accent-600 hover:text-accent-700 transition-colors flex items-center gap-1 bg-accent-50/80 px-3 py-1 rounded-md border border-accent-200"
            >
              <ShieldCheck class="w-4 h-4" />
              <span>Panel Admin</span>
            </NuxtLink>
          </template>
        </nav>

        <!-- Right Side Actions & User Menu -->
        <div class="flex items-center gap-4">
          <!-- Cart Icon -->
          <NuxtLink
            to="/cart"
            class="relative p-2.5 rounded-lg bg-slate-50 border border-[#E2E8F0] text-slate-700 hover:text-brand-600 hover:border-brand-200 transition-all flex items-center gap-2"
          >
            <ShoppingCart class="w-5 h-5 text-brand-600" />
            <span v-if="totalItemCount > 0" class="font-bold text-xs text-brand-900">
              {{ totalItemCount }}
            </span>
            <span
              v-if="totalItemCount > 0"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse"
            ></span>
          </NuxtLink>

          <!-- Realtime Notifications -->
          <UINotificationBell v-if="user" />

          <!-- User Session Buttons -->
          <template v-if="user">
            <div class="relative group">
              <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-[#E2E8F0] hover:border-brand-200 transition-all">
                <div class="w-8 h-8 rounded-md bg-brand-100 border border-brand-200 text-brand-600 font-bold flex items-center justify-center text-sm">
                  {{ profile?.full_name?.charAt(0) || 'U' }}
                </div>
                <div class="hidden sm:flex flex-col text-left">
                  <span class="text-xs font-bold text-brand-900 truncate max-w-[120px]">
                    {{ profile?.full_name }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">
                    {{ profile?.role }}
                  </span>
                </div>
                <ChevronDown class="w-4 h-4 text-slate-500" />
              </button>

              <!-- Dropdown Menu -->
              <div class="absolute right-0 mt-2 w-48 purity-card p-2 hidden group-hover:block border border-[#E2E8F0] shadow-xl z-50">
                <NuxtLink
                  to="/app/dashboard"
                  class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                >
                  <User class="w-4 h-4 text-brand-600" /> Mi Cuenta
                </NuxtLink>
                <NuxtLink
                  v-if="isAdmin"
                  to="/admin/distributors"
                  class="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-accent-600 hover:bg-accent-50"
                >
                  <ShieldCheck class="w-4 h-4" /> Solicitudes Pendientes
                </NuxtLink>
                <button
                  @click="logout"
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-accent-600 hover:bg-accent-50"
                >
                  <LogOut class="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              Iniciar Sesión
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="btn-accent text-xs sm:text-sm py-2 px-4"
            >
              <UserPlus class="w-4 h-4" />
              <span>Registro Mayorista</span>
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ShoppingCart, ShieldCheck, User, LogOut, ChevronDown, UserPlus } from 'lucide-vue-next';

const { user, profile, isAdmin, isApprovedDistributor, logout } = useB2BAuth();
const { totalItemCount } = useB2BCart();
</script>
