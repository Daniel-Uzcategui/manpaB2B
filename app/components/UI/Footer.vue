<template>
  <footer class="bg-brand-900 text-slate-300 pt-16 pb-12 border-t-4 border-accent-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10">
        <!-- Brand Info -->
        <div class="space-y-4 md:col-span-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-white text-brand-900 flex items-center justify-center font-black text-xl shadow-md">
              M
            </div>
            <span class="font-heading font-extrabold text-2xl text-white">MANPA <span class="text-accent-500">B2B</span></span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Plataforma oficial de venta mayorista corporativa de Manufacturas de Papel, C.A. Líderes industriales en empaques, servilletas, toallas y papel higiénico institucional.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-brand-700 pb-2">Plataforma B2B</h4>
          <ul class="space-y-2 text-xs">
            <li><NuxtLink to="/catalog" class="hover:text-white transition-colors">Catálogo al Mayor</NuxtLink></li>
            <li><NuxtLink to="/auth/register" class="hover:text-white transition-colors">Solicitar Registro de Distribuidor</NuxtLink></li>
            <li><NuxtLink to="/auth/login" class="hover:text-white transition-colors">Acceso Clientes Registrados</NuxtLink></li>
          </ul>
        </div>

        <!-- Product Lines -->
        <div>
          <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-brand-700 pb-2">Líneas de Producción</h4>
          <ul class="space-y-2 text-xs">
            <li><span class="text-slate-300">Papel Higiénico Premium Sutil</span></li>
            <li><span class="text-slate-300">Servilletas de Mesa Gardenia</span></li>
            <li><span class="text-slate-300">Toallas Absorbentes & Intercaladas Maracay</span></li>
            <li><span class="text-slate-300">Cuidado Personal & Pañuelos Faciales</span></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-brand-700 pb-2">Atención Corporativa</h4>
          <ul class="space-y-2 text-xs font-mono">
            <li><span>RIF: J-00000000-0</span></li>
            <li><span>Email: ventas@manpa.com.ve</span></li>
            <li><span>Teléfono: +58 (212) 000-0000</span></li>
            <li><span>Caracas - Venezuela</span></li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-brand-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
        <p>© {{ new Date().getFullYear() }} Manufacturas de Papel, C.A. Todos los derechos reservados. Industrial Purity Design System.</p>
        <div class="flex gap-6">
          <span>Términos y Condiciones B2B</span>
          <span>Política de Calidad ISO</span>
        </div>
      </div>
    </div>
  </footer>
</template>
