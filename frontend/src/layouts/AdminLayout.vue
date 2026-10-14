<template>
  <div class="layout-wrapper">

    <!-- Navbar Admin -->
    <nav class="navbar" role="navigation" aria-label="Panel de administración">
      <div class="nav-brand">
        <span class="brand-name">Admin</span>
        <span class="brand-sep">|</span>
        <span class="brand-sub">Citas Médicas</span>
      </div>

      <div class="nav-links">
        <router-link to="/admin/hoy" class="nav-link" active-class="active">Agenda del día</router-link>
        <router-link to="/admin/reservados" class="nav-link" active-class="active">Reservados</router-link>
        <router-link to="/admin/usuarios" class="nav-link" active-class="active">Usuarios</router-link>
      </div>

      <div class="nav-right">
        <NotificationBell />
        <button class="btn-logout" @click="handleLogout">
          {{ authStore.user?.name }} | Salir
        </button>
      </div>
    </nav>

    <!-- Contenido -->
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
        <span>Panel de Administración</span>
        <span class="footer-sep">|</span>
        <span>Citas Médicas &mdash; PostgreSQL + Express + Vue 3</span>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import NotificationBell from '../components/NotificationBell.vue';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1b1b2f 0%, #2d2b55 100%);
  padding: 0 2rem;
  height: 60px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.35);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: white;
  font-weight: 700;
  user-select: none;
}
.brand-icon { font-size: 1.3rem; }
.brand-name { font-size: 1.1rem; color: #f0c040; }
.brand-sep { color: rgba(255,255,255,0.3); }
.brand-sub { font-size: 0.9rem; color: rgba(255,255,255,0.65); }

.nav-links {
  display: flex;
  gap: 0.5rem;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  font-size: 0.93rem;
  font-weight: 500;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.18s ease;
}
.nav-link:hover { background: rgba(255,255,255,0.1); color: white; text-decoration: none; }
.nav-link.active { background: #f0c040; color: #1b1b2f; font-weight: 700; }

.nav-icon { font-size: 1rem; }

.btn-logout {
  padding: 0.45rem 1rem;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.75);
  border: 1.5px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-logout:hover { background: #e53935; color: white; border-color: #e53935; }

.main-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1140px;
  margin: 0 auto;
  width: 100%;
}

/* Transición */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to   { opacity: 0; transform: translateY(-4px); }

.footer {
  background-color: #0d1117;
  color: rgba(255,255,255,0.4);
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
.footer-sep { opacity: 0.25; }

@media (max-width: 600px) {
  .navbar { padding: 0 1rem; flex-wrap: wrap; height: auto; padding: 0.5rem 1rem; gap: 0.5rem; }
  .brand-sep, .brand-sub { display: none; }
  .main-content { padding: 1.25rem 1rem; }
}
</style>
