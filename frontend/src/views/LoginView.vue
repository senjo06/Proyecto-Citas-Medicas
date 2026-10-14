<template>
  <div class="login-page">
    <div class="login-card">

      <!-- Logo / Título -->
      <div class="login-header">
        <div class="login-icon"></div>
        <h1 class="login-title">Citas Médicas</h1>
        <p class="login-subtitle">Ingresá tus credenciales para continuar</p>
      </div>

      <!-- Alerta de error -->
      <transition name="slide-alert">
        <div v-if="authStore.error" class="alert-error" role="alert">
          <span></span> {{ authStore.error }}
        </div>
      </transition>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" novalidate>

        <div class="form-group">
          <label for="email">Correo electrónico o usuario</label>
          <div class="input-icon-wrap">
            <span class="input-icon"></span>
            <input
              id="email"
              v-model="form.email"
              type="text"
              placeholder="Usuario"
              autocomplete="username"
              required
              :disabled="authStore.loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-icon-wrap">
            <span class="input-icon"></span>
            <input
              id="password"
              v-model="form.password"
              :type="showPw ? 'text' : 'password'"
              placeholder="Contraseña"
              autocomplete="current-password"
              required
              :disabled="authStore.loading"
            />
            <button
              type="button"
              class="toggle-pw"
              @click="showPw = !showPw"
              :aria-label="showPw ? 'Ocultar' : 'Mostrar'"
            >{{ showPw ? '' : '' }}</button>
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="authStore.loading || !form.email || !form.password">
          <span v-if="!authStore.loading">Ingresar →</span>
          <span v-else class="btn-loading">
            <span class="spinner-sm"></span> Verificando...
          </span>
        </button>

      </form>

      <p class="register-link">
        ¿No tenés cuenta?
        <router-link to="/registro">Registrate aquí</router-link>
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const showPw = ref(false);

const handleLogin = async () => {
  const ok = await authStore.login(form.value.email, form.value.password);
  if (ok) {
    if (authStore.isAdmin) {
      router.push('/admin/reservados');
    } else {
      router.push('/citas');
    }
  }
};

// Rellena el formulario con las credenciales de demo
const fillAdmin = () => { form.value = { email: 'admin', password: '1234' }; };
const fillUser  = () => { form.value = { email: '', password: '' }; };
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0d47a1 0%, #1a73e8 60%, #42a5f5 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
}

/* Header */
.login-header { text-align: center; margin-bottom: 1.75rem; }
.login-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.login-title { font-size: 1.5rem; color: #0d47a1; margin-bottom: 0.3rem; }
.login-subtitle { font-size: 0.88rem; color: #888; }

/* Alerta */
.alert-error {
  display: flex; align-items: center; gap: 0.5rem;
  background: #f8d7da; color: #721c24;
  border: 1px solid #f1b0b7;
  padding: 0.7rem 0.9rem; border-radius: 8px;
  font-size: 0.88rem; font-weight: 500;
  margin-bottom: 1rem;
}
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.22s ease; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-6px); }

/* Formulario */
.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block; font-size: 0.84rem;
  font-weight: 600; color: #444; margin-bottom: 0.35rem;
}
.input-icon-wrap {
  position: relative; display: flex; align-items: center;
}
.input-icon {
  position: absolute; left: 0.75rem;
  font-size: 1rem; pointer-events: none;
}
.input-icon-wrap input {
  width: 100%;
  padding: 0.65rem 0.85rem 0.65rem 2.5rem;
  border: 1.5px solid #ced4da; border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.input-icon-wrap input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26,115,232,0.15);
  outline: none;
}
.input-icon-wrap input:disabled { background: #f5f5f5; color: #aaa; }
.toggle-pw {
  position: absolute; right: 0.75rem;
  background: transparent; border: none;
  font-size: 1rem; cursor: pointer; padding: 0;
  line-height: 1;
}

/* Botón login */
.btn-login {
  width: 100%; margin-top: 0.5rem;
  padding: 0.8rem;
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  color: white; border: none; border-radius: 10px;
  font-size: 1rem; font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.btn-login:hover:not(:disabled) {
  background: linear-gradient(135deg, #1557b0, #0a2d6e);
  box-shadow: 0 6px 18px rgba(26,115,232,0.35);
  transform: translateY(-1px);
}
.btn-login:disabled { background: #b0bec5; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-loading { display: flex; align-items: center; gap: 0.5rem; }

/* Link de registro */
.register-link {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.88rem;
  color: #888;
}
.register-link a {
  color: #1a73e8;
  font-weight: 600;
  text-decoration: none;
}
.register-link a:hover { text-decoration: underline; }

/* Hints de demo */
.login-hints {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px dashed #dee2e6;
}
.hint-title {
  font-size: 0.75rem; font-weight: 700;
  color: #999; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 0.6rem;
}
.hint-row {
  display: flex; align-items: center; gap: 0.6rem;
  font-size: 0.82rem; color: #555;
  padding: 0.4rem 0.5rem; border-radius: 6px;
  cursor: pointer; transition: background 0.15s;
  margin-bottom: 0.3rem;
}
.hint-row:hover { background: #e9ecef; }
.hint-row code {
  background: #e8f0fe; color: #1a73e8;
  padding: 0.05rem 0.35rem; border-radius: 4px;
  font-size: 0.8rem;
}
.hint-badge {
  padding: 0.15rem 0.55rem; border-radius: 20px;
  font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.4px;
  flex-shrink: 0;
}
.hint-badge.admin { background: #fff3cd; color: #856404; }
.hint-badge.user  { background: #d4edda; color: #155724; }

/* Spinner */
.spinner-sm {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .login-card { padding: 2rem 1.25rem; }
}
</style>

