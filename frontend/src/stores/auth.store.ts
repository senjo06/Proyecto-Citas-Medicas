// frontend/src/stores/auth.store.ts
// Maneja la sesión del usuario autenticado.
// La sesión se persiste en sessionStorage (se borra al cerrar el tab).

import { defineStore } from 'pinia';
import axios from 'axios';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

const SESSION_KEY = 'auth_session';

// Restaura la sesión desde sessionStorage si existe
function loadSession(): { user: AuthUser; role: UserRole } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const session = loadSession();
    return {
      user: session?.user ?? null,
      role: session?.role ?? null,
      loading: false,
      error: null
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.role === 'admin',
    isUser: (state) => state.role === 'user'
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        const BASE_URL = import.meta.env.VITE_API_URL ?? '';
        const { data } = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });

        if (data.success) {
          this.user = data.user;
          this.role = data.role;
          // Persistir sesión
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: data.user, role: data.role }));
          return true;
        }
        return false;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al iniciar sesión.';
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.role = null;
      this.error = null;
      sessionStorage.removeItem(SESSION_KEY);
    },

    // Actualiza los datos del usuario en el store y sessionStorage
    updateUser(data: Partial<AuthUser>) {
      if (this.user) {
        this.user = { ...this.user, ...data };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: this.user, role: this.role }));
      }
    }
  }
});
