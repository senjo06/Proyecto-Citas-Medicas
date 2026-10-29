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
        <router-link to="/citas/historial" class="nav-link" active-class="active">Historial</router-link>
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
  background: #f6f8fa;
}

/* ── Navbar ── */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #e7ecef;
  padding: 0 max(1.5rem, calc((100% - 1140px) / 2));
  height: 68px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(21, 43, 53, 0.035);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.97rem;
  font-weight: 700;
  color: #18343c;
  user-select: none;
}
.brand-icon {
  width: 34px;
  height: 34px;
  padding: 7px;
  border-radius: 10px;
  color: #0f8179;
  background: #e8f7f5;
}

.nav-links {
  display: flex;
  gap: 0.35rem;
}
.nav-link {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #64777d;
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
}
.nav-link:hover { color: #173d43; background: #f2f7f7; text-decoration: none; }
.nav-link.active { color: #0f766e; background: #eaf6f4; font-weight: 650; }

.nav-end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-user {
  font-size: 0.85rem;
  color: #496168;
  font-weight: 550;
}
.btn-nav-action {
  padding: 0.45rem 0.8rem;
  background: transparent;
  border: 1px solid #e1e8eb;
  border-radius: 8px;
  font-size: 0.83rem;
  color: #64777d;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-nav-action:hover { border-color: #f1c9c9; color: #b93838; background: #fff7f7; }

/* ── Contenido ── */
.main-content {
  flex: 1;
  padding: 2rem 1.5rem 2.75rem;
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}

/* ── Transición ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Footer ── */
.footer {
  background: #fff;
  border-top: 1px solid #e7ecef;
  text-align: center;
  padding: 0.85rem;
  font-size: 0.75rem;
  color: #87979b;
}

@media (max-width: 600px) {
  .navbar {
    height: auto;
    min-height: 60px;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
  }
  .nav-links {
    order: 3;
    flex: 0 0 100%;
    overflow-x: auto;
    justify-content: flex-start;
    scrollbar-width: none;
  }
  .nav-links::-webkit-scrollbar { display: none; }
  .nav-link { flex-shrink: 0; }
  .nav-end { margin-left: auto; }
  .nav-user { display: none; }
  .btn-nav-action { white-space: nowrap; }
  .main-content { padding: 1.25rem 1rem; }
}

@media (max-width: 360px) {
  .navbar { padding-right: 0.75rem; padding-left: 0.75rem; }
  .nav-brand { font-size: 0.85rem; }
  .btn-nav-action { padding: 0.3rem 0.55rem; font-size: 0.78rem; }
  .main-content { padding-right: 0.75rem; padding-left: 0.75rem; }
}
</style>
