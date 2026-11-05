<template>
  <div class="doctors-view">

    <!-- Encabezado -->
    <header class="page-header">
      <h1>Gestión de Doctores</h1>
      <p class="subtitle">Alta, edición y baja de especialistas médicos del sistema.</p>
    </header>

    <!-- Alertas -->
    <transition name="slide-alert">
      <div v-if="doctorStore.successMessage" class="alert alert-success" role="alert">
        <span></span>
        <span>{{ doctorStore.successMessage }}</span>
        <button class="alert-close" @click="doctorStore.clearMessages()"></button>
      </div>
    </transition>
    <transition name="slide-alert">
      <div v-if="doctorStore.error" class="alert alert-error" role="alert">
        <span></span>
        <span>{{ doctorStore.error }}</span>
        <button class="alert-close" @click="doctorStore.clearMessages()"></button>
      </div>
    </transition>

    <div class="layout-grid">

      <!-- ── Panel formulario ── -->
      <aside class="form-panel card">
        <h2 class="panel-title">
          {{ editingDoctor ? ' Editar doctor' : ' Nuevo doctor' }}
        </h2>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-group">
            <label for="name">Nombre completo</label>
            <input id="name" v-model="form.name" type="text" placeholder="Ej: Dr. Juan Pérez" required />
          </div>

          <div class="form-group">
            <label for="specialty">Especialidad</label>
            <input id="specialty" v-model="form.specialty" type="text" placeholder="Ej: Cardiología" required />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="doctorStore.loading">
              <span v-if="!doctorStore.loading">{{ editingDoctor ? 'Actualizar' : 'Crear doctor' }}</span>
              <span v-else class="btn-loading"><span class="spinner-sm"></span> Guardando...</span>
            </button>
            <button v-if="editingDoctor" type="button" class="btn-ghost" @click="cancelEdit">Cancelar</button>
          </div>
        </form>
      </aside>

      <!-- ── Panel tabla ── -->
      <section class="table-panel card">
        <div class="table-toolbar">
          <h2 class="panel-title"> Doctores registrados</h2>
          <button class="btn-outline btn-sm" @click="doctorStore.loadDoctors()" :disabled="doctorStore.loading">
             Refrescar
          </button>
        </div>

        <!-- Loading -->
        <div v-if="userStore.loading && userStore.users.length === 0" class="state-box">
          <div class="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>

        <!-- Sin datos -->
        <div v-else-if="userStore.users.length === 0" class="state-box">
          <span class="state-emoji"></span>
          <p>No hay usuarios registrados aún.</p>
        </div>

        <!-- Tabla responsive -->
        <div v-else class="table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Nombre</th>
                <th scope="col">Email</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Registrado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userStore.users" :key="user.id">
                <td class="td-id">{{ user.id }}</td>
                <td class="td-name">
                  <div class="user-avatar">{{ initials(user.name) }}</div>
                  {{ user.name }}
                </td>
                <td class="td-email">{{ user.email }}</td>
                <td class="td-phone">{{ user.phone ?? '—' }}</td>
                <td class="td-date">{{ formatDate(user.created_at) }}</td>
                <td class="td-actions">
                  <button class="btn-edit" @click="startEdit(user)" title="Editar usuario">
                    
                  </button>
                  <button
                    class="btn-delete"
                    :disabled="userStore.loading"
                    @click="openDeleteModal(user)"
                    title="Eliminar usuario"
                  >
                    
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Contador -->
        <p v-if="userStore.users.length > 0" class="table-count">
          {{ userStore.users.length }} usuario{{ userStore.users.length !== 1 ? 's' : '' }} en total
        </p>
      </section>
    </div>

    <!-- ── Modal de confirmación de borrado ── -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="deleteModal.visible" class="modal-overlay" @click.self="closeDeleteModal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-box">
            <div class="modal-icon"></div>
            <h3 id="modal-title">Eliminar usuario</h3>
            <p>¿Seguro que querés eliminar a <strong>{{ deleteModal.userName }}</strong>?</p>
            <p class="modal-warning">Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="btn-ghost" @click="closeDeleteModal">Cancelar</button>
              <button class="btn-danger" :disabled="userStore.loading" @click="confirmDelete">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '../stores/user.store';
import type { User } from '../services/user.service';

const userStore = useUserStore();

// ── Estado del formulario ──
const editingUser = ref<User | null>(null);
const showPassword = ref(false);
const form = ref({ name: '', email: '', password: '', phone: '' });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmailValid = computed(() => !form.value.email || emailRegex.test(form.value.email));
const isPasswordStrong = computed(() => {
  if (!form.value.password) return true; // En modo edición puede estar vacío
  const pw = form.value.password;
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
});

// ── Modal de borrado ──
const deleteModal = ref({ visible: false, userId: 0, userName: '' });

onMounted(() => {
  userStore.loadUsers();
});

// Auto-cierra el mensaje de éxito después de 4s
watch(() => userStore.successMessage, (msg) => {
  if (msg) setTimeout(() => userStore.clearMessages(), 4000);
});

// ── Formulario ──
const handleSubmit = async () => {
  if (!isEmailValid.value) { userStore.error = 'Email inválido.'; return; }
  if (!editingUser.value && !isPasswordStrong.value) { userStore.error = 'Contraseña débil.'; return; }
  if (!form.value.phone) { userStore.error = 'Teléfono es obligatorio.'; return; }
  
  if (editingUser.value) {
    await userStore.editUser(editingUser.value.id, {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone
    });
  } else {
    await userStore.addUser({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone
    });
  }
  if (!userStore.error) resetForm();
};

const startEdit = (user: User) => {
  editingUser.value = user;
  form.value = { name: user.name, email: user.email, password: '', phone: user.phone ?? '' };
  userStore.clearMessages();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  editingUser.value = null;
  resetForm();
  userStore.clearMessages();
};

const resetForm = () => {
  form.value = { name: '', email: '', password: '', phone: '' };
  editingUser.value = null;
  showPassword.value = false;
};

// ── Modal borrado ──
const openDeleteModal = (user: User) => {
  deleteModal.value = { visible: true, userId: user.id, userName: user.name };
};

const closeDeleteModal = () => {
  deleteModal.value = { visible: false, userId: 0, userName: '' };
};

const confirmDelete = async () => {
  await userStore.deleteUser(deleteModal.value.userId);
  closeDeleteModal();
};

// ── Helpers ──
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() ?? '';
  // Si hay 3+ palabras, el apellido es la palabra 2 (índice 2), si hay 2 es la palabra 1
  const last  = (parts.length >= 3 ? parts[2] : parts[1])?.[0]?.toUpperCase() ?? '';
  return first + last;
};
</script>

<style scoped>
.users-view { width: 100%; }

/* ── Encabezado ─────────────────────── */
.page-header { margin-bottom: 1.75rem; text-align: center; }
.page-header h1 { font-size: 1.9rem; color: #1e293b; margin-bottom: 0.4rem; }
.subtitle { color: #666; font-size: 0.92rem; }

/* ── Alertas ────────────────────────── */
.alert {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.75rem 1rem; border-radius: 8px;
  margin-bottom: 1rem; font-size: 0.93rem; font-weight: 500;
}
.alert-success { background: #d4edda; color: #155724; border: 1px solid #b7dfbc; }
.alert-error   { background: #f8d7da; color: #721c24; border: 1px solid #f1b0b7; }
.alert-close {
  margin-left: auto; background: transparent; border: none;
  font-size: 1.2rem; color: inherit; opacity: 0.6; cursor: pointer; padding: 0 0.25rem;
}
.alert-close:hover { opacity: 1; }
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.25s ease; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── Layout de dos columnas ─────────── */
.layout-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* ── Cards ──────────────────────────── */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: none;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}
.panel-title {
  font-size: 1.05rem;
  color: #1e293b;
  margin-bottom: 1.25rem;
}

/* ── Formulario ─────────────────────── */
.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block; font-size: 0.85rem;
  font-weight: 600; color: #444; margin-bottom: 0.35rem;
}
.form-group input {
  width: 100%; padding: 0.6rem 0.85rem;
  border: 1.5px solid #ced4da; border-radius: 7px;
  font-size: 0.95rem; transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.form-group input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26,115,232,0.15);
}
.input-wrapper { position: relative; }
.input-wrapper input { padding-right: 2.5rem; }
.toggle-pw {
  position: absolute; right: 0.5rem; top: 50%;
  transform: translateY(-50%);
  background: transparent; border: none;
  font-size: 1rem; cursor: pointer; padding: 0.2rem;
  line-height: 1;
}
.field-hint { font-size: 0.78rem; color: #888; margin-top: 0.3rem; display: block; }
.field-error { font-size: 0.78rem; color: #dc2626; margin-top: 0.25rem; display: block; }

.form-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; }

/* ── Botones ────────────────────────── */
.btn-primary {
  flex: 1; padding: 0.65rem 1rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dk));
  color: white; border: none; border-radius: 8px;
  font-size: 0.93rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; display: flex; align-items: center; justify-content: center;
}
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, var(--color-primary-dk), #1e293b); box-shadow: 0 4px 12px rgba(26,115,232,0.3); }
.btn-primary:disabled { background: #b0bec5; cursor: not-allowed; }

.btn-ghost {
  padding: 0.65rem 1rem; background: transparent;
  color: #555; border: 1.5px solid #ddd;
  border-radius: 8px; font-size: 0.93rem; cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover { background: #f5f5f5; border-color: #bbb; }

.btn-outline {
  padding: 0.5rem 1rem; background: white;
  color: var(--color-primary); border: 1.5px solid var(--color-primary);
  border-radius: 7px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
}
.btn-outline:hover:not(:disabled) { background: var(--color-primary-lt); }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 0.38rem 0.85rem; font-size: 0.83rem; }

.btn-loading { display: flex; align-items: center; gap: 0.4rem; }

/* ── Toolbar tabla ──────────────────── */
.table-toolbar {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 1rem;
}

/* ── Tabla ──────────────────────────── */
.table-wrapper { overflow-x: auto; border-radius: 8px; }
.users-table {
  width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 520px;
}
.users-table th {
  background: var(--color-bg); color: #555; font-weight: 600;
  text-align: left; padding: 0.7rem 0.9rem;
  border-bottom: 2px solid #e9ecef; white-space: nowrap;
}
.users-table td {
  padding: 0.65rem 0.9rem; border-bottom: 1px solid #f0f0f0;
  color: #333; vertical-align: middle;
}
.users-table tr:last-child td { border-bottom: none; }
.users-table tr:hover td { background: #fafbff; }

.td-id { color: #999; font-size: 0.8rem; width: 36px; }
.td-name { display: flex; align-items: center; gap: 0.6rem; font-weight: 500; white-space: nowrap; }
.td-email { color: #555; }
.td-date { color: #888; white-space: nowrap; }
.td-actions { display: flex; gap: 0.4rem; }

.user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #1e293b);
  color: white; font-size: 0.72rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.btn-edit {
  padding: 0.3rem 0.55rem; background: var(--color-surface)8e1;
  border: 1px solid #ffc107; border-radius: 6px;
  font-size: 0.85rem; cursor: pointer; transition: background 0.2s;
}
.btn-edit:hover { background: #ffc107; }

.btn-delete {
  padding: 0.3rem 0.55rem; background: #ffeef0;
  border: 1px solid #f5c6cb; border-radius: 6px;
  font-size: 0.85rem; cursor: pointer; transition: background 0.2s;
}
.btn-delete:hover:not(:disabled) { background: #f5c6cb; }
.btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }

.table-count { font-size: 0.8rem; color: #aaa; margin-top: 0.75rem; text-align: right; }

/* ── Estados ────────────────────────── */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 2.5rem 1rem; color: #999;
}
.state-emoji { font-size: 2rem; }

/* Spinners */
.spinner {
  width: 36px; height: 36px;
  border: 4px solid #e0e0e0; border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
.spinner-sm {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal ──────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-box {
  background: white; border-radius: 16px;
  padding: 2rem; max-width: 380px; width: 100%;
  text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.modal-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.modal-box h3 { font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--color-text); }
.modal-box p { font-size: 0.93rem; color: #555; }
.modal-warning { color: #b91c1c; font-size: 0.82rem; margin-top: 0.35rem; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: center; }
.btn-danger {
  padding: 0.65rem 1.4rem; background: #dc2626;
  color: white; border: none; border-radius: 8px;
  font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { background: #ef9a9a; cursor: not-allowed; }

.modal-enter-active, .modal-leave-active { transition: all 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.92); }

/* ── Responsive ─────────────────────── */
@media (max-width: 860px) {
  .layout-grid { grid-template-columns: 1fr; }
}
</style>


