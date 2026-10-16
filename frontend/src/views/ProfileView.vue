<template>
  <div class="profile-view">

    <header class="page-header">
      <h1>Mi Perfil</h1>
      <p class="subtitle">Actualizá tus datos personales de acceso al sistema.</p>
    </header>

    <!-- Alertas -->
    <transition name="slide-alert">
      <div v-if="successMsg" class="alert alert-success" role="alert">
        <span></span> {{ successMsg }}
        <button class="alert-close" @click="successMsg = null"></button>
      </div>
    </transition>
    <transition name="slide-alert">
      <div v-if="errorMsg" class="alert alert-error" role="alert">
        <span></span> {{ errorMsg }}
        <button class="alert-close" @click="errorMsg = null"></button>
      </div>
    </transition>

    <div class="profile-grid">

      <!-- ── Avatar / Info actual ── -->
      <aside class="profile-card card">
        <div class="avatar-circle">{{ initials }}</div>
        <h2 class="profile-name">{{ authStore.user?.name }}</h2>
        <p class="profile-email">{{ authStore.user?.email }}</p>
        <div class="profile-badge">
          <span class="badge user"> Usuario</span>
        </div>
      </aside>

      <!-- ── Formulario de edición ── -->
      <section class="form-card card">
        <h2 class="panel-title"> Editar datos</h2>

        <form @submit.prevent="handleSave" novalidate>

          <div class="form-group">
            <label for="name">Nombre completo</label>
            <input id="name" v-model="form.name" type="text"
              placeholder="Tu nombre" required :disabled="saving" />
          </div>

          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model="form.email" type="email"
              placeholder="Tu email" required :disabled="saving" />
          </div>

          <div class="form-group">
            <label for="phone">Teléfono</label>
            <input id="phone" v-model="form.phone" type="tel"
              placeholder="Ej: +57 300 123 4567" :disabled="saving" />
          </div>

          <div class="section-divider">
            <span>Cambiar contraseña (opcional)</span>
          </div>

          <div class="form-group">
            <label for="newPassword">Nueva contraseña</label>
            <div class="input-wrap">
              <input id="newPassword" v-model="form.newPassword"
                :type="showPw ? 'text' : 'password'"
                placeholder="Dejar vacío para no cambiar"
                :disabled="saving" minlength="6" />
              <button type="button" class="toggle-pw"
                @click="showPw = !showPw">{{ showPw ? '' : '' }}</button>
            </div>
            <span class="field-hint">Mínimo 6 caracteres.</span>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar contraseña</label>
            <div class="input-wrap">
              <input id="confirmPassword" v-model="form.confirmPassword"
                :type="showPw ? 'text' : 'password'"
                placeholder="Repetí la nueva contraseña"
                :disabled="saving" />
            </div>
            <span v-if="form.newPassword && form.newPassword !== form.confirmPassword"
              class="field-error">Las contraseñas no coinciden.</span>
          </div>

          <button type="submit" class="btn-primary"
            :disabled="saving || (!!form.newPassword && form.newPassword !== form.confirmPassword)">
            <span v-if="!saving"> Guardar cambios</span>
            <span v-else class="btn-loading">
              <span class="spinner-sm"></span> Guardando...
            </span>
          </button>

        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();

const saving = ref(false);
const showPw = ref(false);
const successMsg = ref<string | null>(null);
const errorMsg = ref<string | null>(null);

const form = ref({
  name: '',
  email: '',
  phone: '',
  newPassword: '',
  confirmPassword: ''
});

onMounted(() => {
  form.value.name  = authStore.user?.name  ?? '';
  form.value.email = authStore.user?.email ?? '';
  form.value.phone = authStore.user?.phone ?? '';
});

// Auto-cierra mensaje de éxito
watch(successMsg, (v) => { if (v) setTimeout(() => successMsg.value = null, 5000); });

const initials = computed(() => {
  const parts = (authStore.user?.name ?? 'U').trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() ?? '';
  const last  = (parts.length >= 3 ? parts[2] : parts[1])?.[0]?.toUpperCase() ?? '';
  return first + last;
});

const handleSave = async () => {
  if (form.value.newPassword && form.value.newPassword !== form.value.confirmPassword) return;

  saving.value = true;
  errorMsg.value = null;

  const BASE = import.meta.env.VITE_API_URL ?? '';
  const userId = authStore.user!.id;

  try {
    // 1. Actualizar datos del usuario
    const payload: any = { name: form.value.name, email: form.value.email, phone: form.value.phone || null };
    if (form.value.newPassword) payload.password = form.value.newPassword;

    await axios.put(`${BASE}/api/users/${userId}`, payload);

    // 2. Actualizar el store con los nuevos datos
    authStore.updateUser({ name: form.value.name, email: form.value.email });

    // 3. Enviar notificación al admin
    const changes: string[] = [];
    if (form.value.name  !== authStore.user?.name)  changes.push('nombre');
    if (form.value.email !== authStore.user?.email) changes.push('email');
    if (form.value.newPassword) changes.push('contraseña');

    const changeList = changes.length > 0 ? changes.join(', ') : 'datos del perfil';

    await axios.post(`${BASE}/api/notifications`, {
      userId,
      userName: form.value.name,
      message: `El usuario "${form.value.name}" actualizó su ${changeList}.`
    });

    // 4. Limpiar contraseña
    form.value.newPassword = '';
    form.value.confirmPassword = '';
    successMsg.value = '¡Cambios guardados exitosamente!';

  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar los cambios.';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.profile-view { width: 100%; }
.page-header { margin-bottom: 1.75rem; text-align: center; }
.page-header h1 { font-size: 1.9rem; color: #1e293b; margin-bottom: 0.4rem; }
.subtitle { color: #666; font-size: 0.92rem; }

.alert { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.93rem; font-weight: 500; }
.alert-success { background: #d4edda; color: #155724; border: 1px solid #b7dfbc; }
.alert-error   { background: #f8d7da; color: #721c24; border: 1px solid #f1b0b7; }
.alert-close { margin-left: auto; background: transparent; border: none; font-size: 1.2rem; color: inherit; opacity: 0.6; cursor: pointer; }
.alert-close:hover { opacity: 1; }
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.25s ease; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-8px); }

.profile-grid { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; align-items: start; }
.card { background: white; border-radius: 8px; box-shadow: none; padding: 1.5rem; border: 1px solid #e5e7eb; }

/* Avatar */
.profile-card { text-align: center; }
.avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1e293b); color: white; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.profile-name { font-size: 1.05rem; color: #111827; margin-bottom: 0.25rem; }
.profile-email { font-size: 0.83rem; color: #888; margin-bottom: 1rem; word-break: break-all; }
.badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.badge.user { background: #eff6ff; color: #1d4ed8; }

/* Formulario */
.panel-title { font-size: 1.05rem; color: #1e293b; margin-bottom: 1.25rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 0.35rem; }
.form-group input { width: 100%; padding: 0.6rem 0.85rem; border: 1.5px solid #ced4da; border-radius: 7px; font-size: 0.95rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
.form-group input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(26,115,232,0.15); outline: none; }
.form-group input:disabled { background: #f5f5f5; }
.input-wrap { position: relative; }
.input-wrap input { padding-right: 2.5rem; }
.toggle-pw { position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; font-size: 1rem; cursor: pointer; }
.field-hint { font-size: 0.78rem; color: #888; margin-top: 0.3rem; display: block; }
.field-error { font-size: 0.78rem; color: #e53935; margin-top: 0.3rem; display: block; font-weight: 600; }

.section-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.25rem 0; }
.section-divider span { font-size: 0.8rem; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
.section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: #e9ecef; }

.btn-primary { width: 100%; margin-top: 0.5rem; padding: 0.7rem; background: linear-gradient(135deg, #2563eb, #1e293b); color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #0a2d6e); box-shadow: 0 4px 14px rgba(26,115,232,0.3); }
.btn-primary:disabled { background: #b0bec5; cursor: not-allowed; }
.btn-loading { display: flex; align-items: center; gap: 0.4rem; }
.spinner-sm { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 700px) {
  .profile-grid { grid-template-columns: 1fr; }
}
</style>


