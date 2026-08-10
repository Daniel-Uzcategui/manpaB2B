<template>
  <footer class="bg-slate-950 border-t border-slate-900 text-slate-400 pt-16 pb-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10">
        <!-- Brand Info -->
        <div class="space-y-4 md:col-span-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-extrabold text-white text-lg">
              M
            </div>
            <span class="font-heading font-black text-2xl text-white">MANPA <span class="text-brand-400">B2B</span></span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Plataforma oficial de venta mayorista corporativa de Manufacturas de Papel, C.A. Líderes en empaques, productos institucionales e industriales.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4">Plataforma B2B</h4>
          <ul class="space-y-2 text-xs">
            <li><NuxtLink to="/catalog" class="hover:text-white transition-colors">Catálogo de Productos</NuxtLink></li>
            <li><NuxtLink to="/auth/register" class="hover:text-white transition-colors">Solicitar Cuenta de Distribuidor</NuxtLink></li>
            <li><NuxtLink to="/auth/login" class="hover:text-white transition-colors">Acceso Clientes Registrados</NuxtLink></li>
          </ul>
        </div>

        <!-- Product Categories -->
        <div>
          <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4">Líneas de Producción</h4>
          <ul class="space-y-2 text-xs">
            <li><span class="text-slate-400">Higiénico e Institucional Jumbo</span></li>
            <li><span class="text-slate-400">Toallas de Papel Autocorte</span></li>
            <li><span class="text-slate-400">Servilletas Horeca y Fast Food</span></li>
            <li><span class="text-slate-400">Papel Bond Resma 75g ISO</span></li>
          </ul>
        </div>

        <!-- Contact & Legal -->
        <div>
          <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4">Atención Corporativa</h4>
          <ul class="space-y-2 text-xs font-mono">
            <li><span>RIF: J-00000000-0</span></li>
            <li><span>Email: ventas@manpa.com.ve</span></li>
            <li><span>Teléfono: +58 (212) 000-0000</span></li>
            <li><span>Caracas - Venezuela</span></li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
        <p>© {{ new Date().getFullYear() }} Manufacturas de Papel, C.A. Todos los derechos reservados.</p>
        <div class="flex gap-6">
          <span>Términos y Condiciones B2B</span>
          <span>Política de Privacidad</span>
        </div>
      </div>
    </div>
  </footer>
</template>
