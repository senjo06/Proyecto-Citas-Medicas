<template>
  <div class="layout-wrapper">

    <!-- Navbar -->
    <nav class="navbar" role="navigation" aria-label="Navegación principal">
      <div class="nav-brand">
        <span class="brand-icon" aria-hidden="true">🏥</span>
        <span class="brand-name">Citas Médicas</span>
      </div>

      <div class="nav-links">
        <router-link to="/" class="nav-link" active-class="active" exact>
          <span class="nav-icon">📅</span> Citas
        </router-link>
        <router-link to="/usuarios" class="nav-link" active-class="active">
          <span class="nav-icon">👥</span> Usuarios
        </router-link>
      </div>
    </nav>

    <!-- Contenido principal -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <span>🏥 Sistema de Gestión de Citas Médicas</span>
        <span class="footer-sep">|</span>
        <span>Transacciones Pesimistas &mdash; <code>SELECT FOR UPDATE</code></span>
        <span class="footer-sep">|</span>
        <span>PostgreSQL + Express + Vue 3</span>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
// MainLayout.vue usa router-link nativo de Vue Router para el manejo
// de rutas activas, evitando duplicar lógica con useRoute/useRouter manualmente.
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Navbar ─────────────────────────────── */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  padding: 0 2rem;
  height: 60px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  user-select: none;
}

.brand-icon {
  font-size: 1.4rem;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-size: 0.93rem;
  font-weight: 500;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.18s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.14);
  color: white;
  text-decoration: none;
}

.nav-link.active {
  background: white;
  color: #1a73e8;
  font-weight: 700;
  border-color: white;
}

.nav-icon {
  font-size: 1rem;
}

/* ── Contenido principal ────────────────── */
.main-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}

/* ── Transición de vistas ───────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Footer ─────────────────────────────── */
.footer {
  background-color: #0d1b2a;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.9rem 1.5rem;
  font-size: 0.78rem;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer code {
  background: rgba(255,255,255,0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #90caf9;
}

.footer-sep {
  opacity: 0.3;
}

/* ── Responsive ─────────────────────────── */
@media (max-width: 600px) {
  .navbar {
    padding: 0 1rem;
  }
  .brand-name {
    font-size: 1rem;
  }
  .nav-link {
    padding: 0.4rem 0.65rem;
    font-size: 0.85rem;
  }
  .main-content {
    padding: 1.25rem 1rem;
  }
  .footer-inner {
    flex-direction: column;
    gap: 0.25rem;
  }
  .footer-sep {
    display: none;
  }
}
</style>
