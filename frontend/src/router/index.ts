import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import UsersView from '../views/UsersView.vue';
import BookedView from '../views/BookedView.vue';
import ProfileView from '../views/ProfileView.vue';
import RegisterView from '../views/RegisterView.vue';
import DoctorPanelView from '../views/DoctorPanelView.vue';

const routes = [
  // ── Login (pública) ───────────────────────────────────────────────
  {
    path: '/',
    name: 'login',
    component: LoginView
  },

  // ── Registro (pública) ────────────────────────────────────────────
  {
    path: '/registro',
    name: 'registro',
    component: RegisterView
  },

  // ── Rutas de usuario normal (requiere auth con role 'user') ───────
  {
    path: '/citas',
    component: MainLayout,
    meta: { requiresAuth: true, role: 'user' },
    children: [
      {
        path: '',
        name: 'citas',
        component: HomeView
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: ProfileView
      }
    ]
  },

  // ── Rutas de administrador (requiere auth con role 'admin') ───────
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'hoy',
        name: 'admin-hoy',
        component: DoctorPanelView
      },
      {
        path: 'reservados',
        name: 'admin-reservados',
        component: BookedView
      },
      {
        path: 'usuarios',
        name: 'admin-usuarios',
        component: UsersView
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// ── Guard global ──────────────────────────────────────────────────
router.beforeEach((to) => {
  const raw = sessionStorage.getItem('auth_session');
  const session = raw ? JSON.parse(raw) : null;
  const role: string | null = session?.role ?? null;

  // 1. Ruta protegida sin sesión → login
  if (to.meta.requiresAuth && !role) {
    return { name: 'login' };
  }

  // 2. Ruta de admin con rol user → citas
  if (to.meta.requiresAuth && to.meta.role === 'admin' && role !== 'admin') {
    return { name: 'citas' };
  }

  // 3. Ruta de user con rol admin → panel admin
  if (to.meta.requiresAuth && to.meta.role === 'user' && role === 'admin') {
    return { name: 'admin-reservados' };
  }

  // 4. Ya logueado intentando ir al login o registro → redirigir a su sección
  if ((to.name === 'login' || to.name === 'registro') && role) {
    return role === 'admin' ? { name: 'admin-reservados' } : { name: 'citas' };
  }
});

export default router;
