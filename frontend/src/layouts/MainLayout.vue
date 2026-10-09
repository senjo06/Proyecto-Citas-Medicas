<template>
  <div class="layout-wrapper">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-brand">
        <span class="brand-icon">🏥</span>
        <span class="brand-name">Citas Médicas</span>
      </div>
      <div class="nav-links">
        <button
          class="nav-btn"
          :class="{ active: $route.path === '/' }"
          @click="router.push('/')"
        >
          📅 Citas
        </button>
        <button
          class="nav-btn"
          :class="{ active: $route.path === '/usuarios' }"
          @click="router.push('/usuarios')"
        >
          👥 Usuarios
        </button>
      </div>
    </nav>

    <!-- Contenido de la vista activa -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>Sistema de Gestión de Citas Médicas &mdash; Transacciones Pesimistas (SELECT FOR UPDATE)</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f0f4f8;
}

/* Navbar */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1a73e8;
  padding: 0.75rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-name {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 0.75rem;
}

.nav-btn {
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 0.45rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-btn.active {
  background: white;
  color: #1a73e8;
  font-weight: 700;
  border-color: white;
}

/* Contenido principal */
.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Footer */
.footer {
  background-color: #1a1a2e;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 1rem;
  font-size: 0.8rem;
}
</style>
