<template>
  <div class="login-page">

    <div class="login-box">
      <!-- Encabezado -->
      <div class="login-head">
        <div class="login-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
        </div>
        <h1>Centro Médico</h1>
        <p>Ingresá tus credenciales para acceder</p>
      </div>

      <!-- Error -->
      <transition name="alert-in">
        <div v-if="authStore.error" class="alert-error">{{ authStore.error }}</div>
      </transition>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" novalidate>
        <div class="field">
          <label for="email">Usuario o correo</label>
          <input
            id="email"
            v-model="form.email"
            type="text"
            placeholder="Ej: juan.perez o correo@email.com"
            autocomplete="username"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <div class="input-row">
            <input
              id="password"
              v-model="form.password"
              :type="showPw ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              :disabled="authStore.loading"
            />
            <button type="button" class="btn-toggle" @click="showPw = !showPw">
              {{ showPw ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="authStore.loading || !form.email || !form.password">
          <span v-if="!authStore.loading">Ingresar</span>
          <span v-else class="loading-row"><span class="spin"></span> Verificando...</span>
        </button>
      </form>

      <p class="register-link">
        ¿No tenés cuenta? <router-link to="/registro">Registrate</router-link>
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
const router    = useRouter();
const authStore = useAuthStore();
const form   = ref({ email: '', password: '' });
const showPw = ref(false);
const handleLogin = async () => {
  const ok = await authStore.login(form.value.email, form.value.password);
  if (ok) router.push(authStore.isAdmin ? '/admin/reservados' : '/citas');
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 1rem;
}

.login-box {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* Encabezado */
.login-head { text-align: center; margin-bottom: 1.75rem; }
.login-logo {
  width: 48px; height: 48px; border-radius: 10px;
  background: #eff6ff; margin: 0 auto 1rem;
  display: flex; align-items: center; justify-content: center;
}
.login-logo svg { width: 26px; height: 26px; color: #2563eb; }
.login-head h1 { font-size: 1.25rem; color: #111827; margin-bottom: 0.25rem; }
.login-head p  { font-size: 0.85rem; color: #6b7280; }

/* Alerta */
.alert-error {
  background: #fef2f2; color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 0.65rem 0.9rem; border-radius: 6px;
  font-size: 0.85rem; margin-bottom: 1rem;
}
.alert-in-enter-active, .alert-in-leave-active { transition: all 0.2s; }
.alert-in-enter-from, .alert-in-leave-to { opacity: 0; transform: translateY(-4px); }

/* Campos */
.field { margin-bottom: 1rem; }
.field label {
  display: block;
  font-size: 0.83rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.35rem;
}
.field input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.field input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
.field input:disabled { background: #f9fafb; color: #9ca3af; }

.input-row { position: relative; }
.input-row input { padding-right: 5rem; }
.btn-toggle {
  position: absolute; right: 0.65rem; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  font-size: 0.75rem; color: #6b7280;
  font-weight: 500; cursor: pointer;
}
.btn-toggle:hover { color: #2563eb; }

/* Botón submit */
.btn-submit {
  width: 100%; margin-top: 0.5rem;
  padding: 0.65rem;
  background: #2563eb;
  color: white; border: none; border-radius: 7px;
  font-size: 0.92rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.btn-submit:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }
.loading-row { display: flex; align-items: center; gap: 0.5rem; }

/* Link registro */
.register-link { text-align: center; margin-top: 1.25rem; font-size: 0.85rem; color: #6b7280; }
.register-link a { color: #2563eb; font-weight: 500; }

/* Spinner */
.spin {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
