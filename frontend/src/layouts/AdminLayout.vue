<template>
  <div class="layout">

    <nav class="navbar">
      <div class="nav-brand">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        <span>Panel Admin</span>
        <span class="brand-divider"></span>
        <span class="brand-sub">Centro Médico</span>
      </div>

      <div class="nav-links">
        <router-link to="/admin/hoy"        class="nav-link" active-class="active">Agenda de hoy</router-link>
        <router-link to="/admin/reservados" class="nav-link" active-class="active">Reservados</router-link>
        <router-link to="/admin/usuarios"   class="nav-link" active-class="active">Usuarios</router-link>
      </div>

      <div class="nav-end">
        <NotificationBell />
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
      Panel de Administración &nbsp;&mdash;&nbsp; Centro Médico
    </footer>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import NotificationBell from '../components/NotificationBell.vue';
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

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e293b;
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
  user-select: none;
}
.brand-icon { width: 18px; height: 18px; color: #60a5fa; }
.nav-brand > span:nth-child(2) { font-size: 0.93rem; font-weight: 600; color: #f1f5f9; }
.brand-divider { width: 1px; height: 16px; background: #334155; }
.brand-sub { font-size: 0.8rem; color: #94a3b8; }

.nav-links { display: flex; gap: 0.25rem; }
.nav-link {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.15s;
}
.nav-link:hover { color: #f1f5f9; background: #334155; text-decoration: none; }
.nav-link.active { color: #bfdbfe; background: #1e3a5f; font-weight: 600; }

.nav-end { display: flex; align-items: center; gap: 0.75rem; }
.nav-user { font-size: 0.83rem; color: #94a3b8; }
.btn-nav-action {
  padding: 0.33rem 0.8rem;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 6px;
  font-size: 0.82rem;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-nav-action:hover { border-color: #ef4444; color: #ef4444; }

.main-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.footer {
  background: #1e293b;
  text-align: center;
  padding: 0.85rem;
  font-size: 0.75rem;
  color: #475569;
}

@media (max-width: 600px) {
  .navbar {
    height: auto;
    min-height: 56px;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
  }
  .brand-sub, .brand-divider { display: none; }
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
  .nav-brand > span:nth-child(2) { font-size: 0.85rem; }
  .btn-nav-action { padding: 0.3rem 0.55rem; font-size: 0.78rem; }
  .main-content { padding-right: 0.75rem; padding-left: 0.75rem; }
}
</style>
