<template>
  <div class="register-page">
    <div class="register-card">

      <div class="register-header">
        <h1 class="register-title">Crear cuenta</h1>
        <p class="register-subtitle">Completá tus datos para registrarte</p>
      </div>

      <!-- Alerta de error -->
      <transition name="slide-alert">
        <div v-if="errorMsg" class="alert-error" role="alert">
          {{ errorMsg }}
        </div>
      </transition>

      <!-- Alerta de éxito -->
      <transition name="slide-alert">
        <div v-if="successMsg" class="alert-success" role="alert">
          {{ successMsg }}
        </div>
      </transition>

      <form @submit.prevent="handleRegister" novalidate>

        <div class="form-group">
          <label for="name">Nombre completo</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Ej: Juan Pérez"
            autocomplete="name"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Ej: juan@correo.com"
            autocomplete="email"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="phone">Teléfono</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="Ej: +57 300 123 4567"
            autocomplete="tel"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrap">
            <input
              id="password"
              v-model="form.password"
              :type="showPw ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
              required
              minlength="6"
              :disabled="loading"
            />
            <button type="button" class="toggle-pw" @click="showPw = !showPw">
              {{ showPw ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirm">Confirmar contraseña</label>
          <input
            id="confirm"
            v-model="form.confirm"
            :type="showPw ? 'text' : 'password'"
            placeholder="Repetí la contraseña"
            required
            :disabled="loading"
          />
          <span v-if="form.confirm && form.password !== form.confirm" class="field-error">
            Las contraseñas no coinciden.
          </span>
        </div>

        <button
          type="submit"
          class="btn-register"
          :disabled="loading || !canSubmit"
        >
          <span v-if="!loading">Crear cuenta</span>
          <span v-else class="btn-loading">
            <span class="spinner-sm"></span> Registrando...
          </span>
        </button>

      </form>

      <p class="login-link">
        ¿Ya tenés cuenta?
        <router-link to="/">Iniciá sesión</router-link>
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { UserService } from '../services/user.service';

const router = useRouter();

const loading = ref(false);
const showPw = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm: ''
});

const canSubmit = computed(() =>
  form.value.name &&
  form.value.email &&
  form.value.password.length >= 6 &&
  form.value.password === form.value.confirm
);

const handleRegister = async () => {
  errorMsg.value = null;
  loading.value = true;
  try {
    await UserService.create({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone || undefined
    });
    successMsg.value = '¡Cuenta creada exitosamente! Redirigiendo al login...';
    setTimeout(() => router.push('/'), 2000);
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al crear la cuenta.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0d47a1 0%, #1a73e8 60%, #42a5f5 100%);
  padding: 1rem;
}

.register-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
}

.register-header { text-align: center; margin-bottom: 1.75rem; }
.register-title { font-size: 1.5rem; color: #0d47a1; margin-bottom: 0.3rem; }
.register-subtitle { font-size: 0.88rem; color: #888; }

/* Alertas */
.alert-error {
  background: #f8d7da; color: #721c24;
  border: 1px solid #f1b0b7;
  padding: 0.7rem 0.9rem; border-radius: 8px;
  font-size: 0.88rem; font-weight: 500;
  margin-bottom: 1rem;
}
.alert-success {
  background: #d4edda; color: #155724;
  border: 1px solid #b7dfbc;
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
.form-group input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #ced4da; border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.form-group input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26,115,232,0.15);
  outline: none;
}
.form-group input:disabled { background: #f5f5f5; }

.input-wrap { position: relative; }
.input-wrap input { padding-right: 5.5rem; }
.toggle-pw {
  position: absolute; right: 0.75rem; top: 50%;
  transform: translateY(-50%);
  background: transparent; border: none;
  font-size: 0.78rem; color: #1a73e8;
  font-weight: 600; cursor: pointer;
}

.field-error { font-size: 0.78rem; color: #e53935; margin-top: 0.3rem; display: block; font-weight: 600; }

/* Botón */
.btn-register {
  width: 100%; margin-top: 0.5rem;
  padding: 0.8rem;
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  color: white; border: none; border-radius: 10px;
  font-size: 1rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.btn-register:hover:not(:disabled) {
  background: linear-gradient(135deg, #1557b0, #0a2d6e);
  box-shadow: 0 6px 18px rgba(26,115,232,0.35);
  transform: translateY(-1px);
}
.btn-register:disabled { background: #b0bec5; cursor: not-allowed; transform: none; }
.btn-loading { display: flex; align-items: center; gap: 0.5rem; }

.spinner-sm {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.login-link {
  text-align: center; margin-top: 1.25rem;
  font-size: 0.88rem; color: #888;
}
.login-link a { color: #1a73e8; font-weight: 600; text-decoration: none; }
.login-link a:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .register-card { padding: 2rem 1.25rem; }
}
</style>
