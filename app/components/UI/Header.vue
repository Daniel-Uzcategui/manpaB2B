<template>
  <header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Brand Logo & Identity -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            M
          </div>
          <div class="flex flex-col">
            <span class="font-heading font-black text-2xl tracking-tight text-white leading-none">
              MANPA <span class="text-brand-400">B2B</span>
            </span>
            <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
              Manufacturas de Papel
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-8">
          <NuxtLink
            to="/"
            class="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            active-class="text-brand-400 font-bold"
          >
            Inicio
          </NuxtLink>
          <NuxtLink
            to="/catalog"
            class="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            active-class="text-brand-400 font-bold"
          >
            Catálogo al Mayor
          </NuxtLink>

          <template v-if="isApprovedDistributor || isAdmin">
            <NuxtLink
              to="/app/dashboard"
              class="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              active-class="text-brand-400 font-bold"
            >
              Portal Distribuidor
            </NuxtLink>
          </template>

          <template v-if="isAdmin">
            <NuxtLink
              to="/admin/distributors"
              class="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              active-class="font-bold"
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
            class="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2"
          >
            <ShoppingCart class="w-5 h-5 text-brand-400" />
            <span v-if="totalItemCount > 0" class="font-bold text-xs text-white">
              {{ totalItemCount }}
            </span>
            <span
              v-if="totalItemCount > 0"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse"
            ></span>
          </NuxtLink>

          <!-- Realtime Notifications -->
          <NotificationBell v-if="user" />

          <!-- User Session Buttons -->
          <template v-if="user">
            <div class="relative group">
              <button class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <div class="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 text-brand-300 font-bold flex items-center justify-center text-sm">
                  {{ profile?.full_name?.charAt(0) || 'U' }}
                </div>
                <div class="hidden sm:flex flex-col text-left">
                  <span class="text-xs font-bold text-white truncate max-w-[120px]">
                    {{ profile?.full_name }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">
                    {{ profile?.role }}
                  </span>
                </div>
                <ChevronDown class="w-4 h-4 text-slate-400" />
              </button>

              <!-- Dropdown Menu -->
              <div class="absolute right-0 mt-2 w-48 glass-panel p-2 hidden group-hover:block border border-slate-800 shadow-2xl z-50">
                <NuxtLink
                  to="/app/dashboard"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <User class="w-4 h-4 text-brand-400" /> Mi Cuenta
                </NuxtLink>
                <NuxtLink
                  v-if="isAdmin"
                  to="/admin/distributors"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:bg-slate-800"
                >
                  <ShieldCheck class="w-4 h-4" /> Solicitudes Pendientes
                </NuxtLink>
                <button
                  @click="logout"
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut class="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1.5"
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
