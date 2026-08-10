# MANPA B2B ECOSYSTEM & CMS

Enterprise B2B E-Commerce & Informational Platform for **Manufacturas de Papel, C.A. (MANPA)**. Built with modern Jamstack architecture using Nuxt v4, Supabase (PostgreSQL 15+, Auth, Storage, Realtime, RLS), TailwindCSS v3, and Resend.

---

## 🛠️ Stack Tecnológico

* **Frontend / Fullstack:** Nuxt v4 (`app/` directory layout, Vue 3 Composition API, `<script setup lang="ts">`).
* **Estilos & UI:** TailwindCSS v3 con tema industrial oscuro glassmorphism y tipografía *Outfit / Plus Jakarta Sans*.
* **BaaS (Backend):** Supabase (PostgreSQL DDL, RPC Pricing Resolver, Row Level Security, Storage & Realtime).
* **Emails Corporativos:** API de Resend enviando notificaciones HTML de bienvenida.
* **PDFs Dynamicos:** Generación proforma en servidor con `jsPDF` y `jspdf-autotable`.

---

## 🚀 Instalación y Configuración Local

### 1. Variables de Entorno (`.env`)

Copia `.env.example` a `.env` e ingresa las credenciales de Supabase y Resend:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
RESEND_API_KEY=re_123456789
```

### 2. Migración de Base de Datos en Supabase

Ejecuta el script SQL maestro ubicado en `supabase/migrations/20260810_init.sql` dentro del **SQL Editor** de tu consola de Supabase.

Este script crea automáticamente:
* Enums (`user_role`, `order_status`, `payment_method`, etc.).
* Tablas (`companies`, `profiles`, `price_lists`, `products`, `custom_prices`, `price_tiers`, `orders`, `order_items`, `messages`, `banners`, `system_settings`).
* Función RPC `get_effective_product_price` para la resolución dinámica de precios según cliente y volumen tier.
* Políticas de Seguridad de Nivel de Fila (**RLS**).
* Datos Semilla de Productos (Papel Higiénico Industrial 500m, Toallas Autocorte 300m, Servilletas, Resmas Bond 75g).

### 3. Ejecutar Servidor de Desarrollo

```bash
npm install
npm run dev
```

El servidor estará corriendo en `http://localhost:3000`.

---

## 📋 Flujo de Negocio & Características Clave

1. **Catálogo Público con Precios Protegidos:**
   * Visitantes sin sesión ven fotos, especificaciones y enlaces para descargar la Ficha Técnica PDF.
   * Los precios permanecen ocultos con el botón CTA *"Registrarse para compras al mayor"*.

2. **Registro de Distribuidores con PDF Obligatorio:**
   * Formulario de Registro requiere RIF/NIT, Razón Social y carga obligatoria de los archivos **RIF PDF** y **Registro Mercantil PDF** al bucket de almacenamiento `registration-docs`.
   * Crea la cuenta con estado `distributor_pending`.

3. **Panel de Administración (`/admin/distributors`):**
   * El staff de Manpa revisa las solicitudes pendientes y visualiza los PDF adjuntos.
   * Al presionar *"Aprobar Distribuidor"*, actualiza el rol a `distributor_approved` y dispara un correo electrónico de bienvenida mediante **Resend**.

4. **Validación de MOQ y Pasos de Empaque (`QuantityStepInput`):**
   * El selector de cantidades en el carrito y catálogo fuerza el incremento exacto según `qty_step` (ej. +24 / -24 uds) y el volumen mínimo obligatorio `min_order_qty`.

5. **Resolución Dinámica de Precios (RPC `get_effective_product_price`):**
   * Determina el precio por unidad evaluando si la empresa tiene asignada una Lista de Precios Personalizada (`custom_prices`), aplicando de lo contrario la Lista General, y calculando los descuentos por volumen (`price_tiers`).

6. **Chat Realtime por Pedido (`/app/orders/[id]`):**
   * Comunicación instantánea entre el distribuidor y el equipo de soporte mediante Supabase Realtime Channels.

7. **Generación de Proformas PDF (`server/api/pdf/generate-po.get.ts`):**
   * Emisión de orden de compra proforma lista para descarga o impresión directa.
