// frontend/src/stores/admin.store.ts
// Maneja el estado de autenticación del panel de administración.
// El PIN se verifica localmente — no se envía al servidor.
// La sesión se guarda en sessionStorage (se borra al cerrar el tab).

import { defineStore } from 'pinia';

// PIN de administrador — cambiar según necesidad
const ADMIN_PIN = '1234';
const SESSION_KEY = 'admin_authenticated';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    authenticated: sessionStorage.getItem(SESSION_KEY) === 'true'
  }),

  actions: {
    /**
     * Verifica el PIN ingresado.
     * Retorna true si es correcto, false si no.
     */
    verifyPin(pin: string): boolean {
      if (pin === ADMIN_PIN) {
        this.authenticated = true;
        sessionStorage.setItem(SESSION_KEY, 'true');
        return true;
      }
      return false;
    },

    /**
     * Cierra la sesión de administrador.
     */
    logout() {
      this.authenticated = false;
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
});
