<template>
  <div class="layout">

    <nav class="navbar">
      <div class="nav-brand">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Centro Médico</span>
      </div>

      <div class="nav-links">
        <router-link to="/citas" class="nav-link" active-class="active">Turnos</router-link>
        <router-link to="/citas/perfil" class="nav-link" active-class="active">Mi perfil</router-link>
      </div>

      <div class="nav-end">
        <span class="nav-user">{{ authStore.user?.name }}</span>
        <button class="btn-nav-action" @click="handleLogout">Cerrar sesión</button>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      Sistema de Gestión de Citas Médicas &nbsp;&mdash;&nbsp; PostgreSQL · Express · Vue 3
    </footer>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
const router    = useRouter();
const authStore = useAuthStore();
const handleLogout = () => { authStore.logout(); router.push('/'); };
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Navbar ── */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 2rem;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  user-select: none;
}
.brand-icon {
  width: 18px;
  height: 18px;
  color: #2563eb;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
}
.nav-link {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.15s;
}
.nav-link:hover { color: #111827; background: #f3f4f6; text-decoration: none; }
.nav-link.active { color: #2563eb; background: #eff6ff; font-weight: 600; }

.nav-end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-user {
  font-size: 0.85rem;
  color: #374151;
  font-weight: 500;
}
.btn-nav-action {
  padding: 0.35rem 0.85rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.83rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-nav-action:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }

/* ── Contenido ── */
.main-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}

/* ── Transición ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Footer ── */
.footer {
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  padding: 0.85rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

@media (max-width: 600px) {
  .navbar { padding: 0 1rem; }
  .nav-user { display: none; }
  .main-content { padding: 1.25rem 1rem; }
}
</style>
