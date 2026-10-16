<template>
  <div class="page">
    <div class="box">
      <div class="head">
        <h1>Crear cuenta</h1>
        <p>Completá tus datos para registrarte en el sistema</p>
      </div>

      <transition name="alert-in">
        <div v-if="errorMsg"  class="alert alert-error">{{ errorMsg }}</div>
      </transition>
      <transition name="alert-in">
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
      </transition>

      <form @submit.prevent="handleRegister" novalidate>
        <div class="field">
          <label for="name">Nombre completo</label>
          <input id="name" v-model="form.name" type="text" placeholder="Ej: Juan Pérez" required :disabled="loading" />
        </div>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" v-model="form.email" type="email" placeholder="Ej: juan@correo.com" required :disabled="loading" />
        </div>
        <div class="field">
          <label for="phone">Teléfono <span class="opt">(opcional)</span></label>
          <input id="phone" v-model="form.phone" type="tel" placeholder="Ej: +57 300 123 4567" :disabled="loading" />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <div class="input-row">
            <input id="password" v-model="form.password" :type="showPw ? 'text' : 'password'" placeholder="Mínimo 6 caracteres" required minlength="6" :disabled="loading" />
            <button type="button" class="btn-toggle" @click="showPw = !showPw">{{ showPw ? 'Ocultar' : 'Mostrar' }}</button>
          </div>
        </div>
        <div class="field">
          <label for="confirm">Confirmar contraseña</label>
          <input id="confirm" v-model="form.confirm" :type="showPw ? 'text' : 'password'" placeholder="Repetí la contraseña" required :disabled="loading" />
          <span v-if="form.confirm && form.password !== form.confirm" class="field-error">Las contraseñas no coinciden.</span>
        </div>
        <button type="submit" class="btn-submit" :disabled="loading || !canSubmit">
          <span v-if="!loading">Crear cuenta</span>
          <span v-else class="loading-row"><span class="spin"></span> Registrando...</span>
        </button>
      </form>

      <p class="link-row">¿Ya tenés cuenta? <router-link to="/">Iniciá sesión</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { UserService } from '../services/user.service';
const router = useRouter();
const loading = ref(false);
const showPw  = ref(false);
const errorMsg   = ref<string|null>(null);
const successMsg = ref<string|null>(null);
const form = ref({ name:'', email:'', phone:'', password:'', confirm:'' });
const canSubmit = computed(() => form.value.name && form.value.email && form.value.password.length >= 6 && form.value.password === form.value.confirm);
const handleRegister = async () => {
  errorMsg.value = null; loading.value = true;
  try {
    await UserService.create({ name: form.value.name, email: form.value.email, password: form.value.password, phone: form.value.phone || undefined });
    successMsg.value = 'Cuenta creada. Redirigiendo...';
    setTimeout(() => router.push('/'), 2000);
  } catch (e: any) { errorMsg.value = e.response?.data?.message || 'Error al crear la cuenta.'; }
  finally { loading.value = false; }
};
</script>

<style scoped>
.page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 1rem; }
.box { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2.25rem 2rem; width: 100%; max-width: 400px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.head { text-align: center; margin-bottom: 1.5rem; }
.head h1 { font-size: 1.2rem; color: #111827; margin-bottom: 0.25rem; }
.head p  { font-size: 0.83rem; color: #6b7280; }
.alert { padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem; }
.alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.alert-in-enter-active, .alert-in-leave-active { transition: all 0.2s; }
.alert-in-enter-from, .alert-in-leave-to { opacity: 0; transform: translateY(-4px); }
.field { margin-bottom: 0.9rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 500; color: #374151; margin-bottom: 0.3rem; }
.opt { font-weight: 400; color: #9ca3af; }
.field input { width: 100%; padding: 0.58rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; color: #111827; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
.field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.field input:disabled { background: #f9fafb; }
.input-row { position: relative; }
.input-row input { padding-right: 5rem; }
.btn-toggle { position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.75rem; color: #6b7280; font-weight: 500; cursor: pointer; }
.btn-toggle:hover { color: #2563eb; }
.field-error { font-size: 0.78rem; color: #dc2626; margin-top: 0.25rem; display: block; }
.btn-submit { width: 100%; margin-top: 0.5rem; padding: 0.62rem; background: #2563eb; color: white; border: none; border-radius: 7px; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; }
.btn-submit:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }
.loading-row { display: flex; align-items: center; gap: 0.5rem; }
.spin { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.link-row { text-align: center; margin-top: 1.1rem; font-size: 0.85rem; color: #6b7280; }
.link-row a { color: #2563eb; font-weight: 500; }
</style>
