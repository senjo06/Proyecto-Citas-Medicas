<template>
  <div class="users-view">
    <header class="page-header">
      <h1>Gestión de Usuarios</h1>
      <p class="subtitle">Alta, edición y baja de pacientes en el sistema</p>
    </header>

    <!-- Alertas -->
    <div v-if="userStore.successMessage" class="alert success">
      ✅ {{ userStore.successMessage }}
    </div>
    <div v-if="userStore.error" class="alert error">
      ⚠️ {{ userStore.error }}
    </div>

    <!-- Formulario para crear / editar -->
    <div class="card form-card">
      <h2>{{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Ej: juan@correo.com"
            required
          />
        </div>
        <div v-if="!editingUser" class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="userStore.loading">
            {{ userStore.loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario' }}
          </button>
          <button v-if="editingUser" type="button" class="btn-secondary" @click="cancelEdit">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <!-- Tabla de usuarios -->
    <div class="card table-card">
      <div class="table-header">
        <h2>Lista de Usuarios</h2>
        <button class="btn-refresh" @click="userStore.loadUsers()">🔄 Refrescar</button>
      </div>

      <div v-if="userStore.loading && userStore.users.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>

      <div v-else-if="userStore.users.length === 0" class="empty-state">
        <p>No hay usuarios registrados aún.</p>
      </div>

      <table v-else class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userStore.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="actions-cell">
              <button class="btn-edit" @click="startEdit(user)">✏️ Editar</button>
              <button class="btn-delete" :disabled="userStore.loading" @click="confirmDelete(user.id)">
                🗑️ Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/user.store';
import type { User } from '../services/user.service';

const userStore = useUserStore();

// Estado del formulario
const editingUser = ref<User | null>(null);
const form = ref({
  name: '',
  email: '',
  password: ''
});

onMounted(() => {
  userStore.loadUsers();
});

const handleSubmit = async () => {
  if (editingUser.value) {
    await userStore.editUser(editingUser.value.id, {
      name: form.value.name,
      email: form.value.email
    });
  } else {
    await userStore.addUser({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password
    });
  }
  // Si no hay error, limpiamos el formulario
  if (!userStore.error) {
    resetForm();
  }
};

const startEdit = (user: User) => {
  editingUser.value = user;
  form.value.name = user.name;
  form.value.email = user.email;
  form.value.password = '';
  userStore.clearMessages();
  // Scroll al formulario
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  editingUser.value = null;
  resetForm();
  userStore.clearMessages();
};

const resetForm = () => {
  form.value = { name: '', email: '', password: '' };
  editingUser.value = null;
};

const confirmDelete = async (id: number) => {
  if (confirm('¿Seguro que deseas eliminar este usuario?')) {
    await userStore.deleteUser(id);
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
</script>

<style scoped>
.users-view {
  width: 100%;
}

.page-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.page-header h1 {
  font-size: 1.8rem;
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
}

/* Alertas */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}
.alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.alert.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

/* Cards */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-card h2,
.table-header h2 {
  margin: 0 0 1.25rem;
  font-size: 1.1rem;
  color: #1a1a2e;
}

/* Formulario */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 0.35rem;
}

.form-group input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.15);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn-primary {
  padding: 0.6rem 1.4rem;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #1557b0; }
.btn-primary:disabled { background: #b0bec5; cursor: not-allowed; }

.btn-secondary {
  padding: 0.6rem 1.2rem;
  background: #f1f3f4;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover { background: #e2e6ea; }

/* Tabla */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-refresh {
  padding: 0.45rem 0.9rem;
  background: #f1f3f4;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-refresh:hover { background: #e2e6ea; }

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.users-table th {
  background: #f8f9fa;
  color: #555;
  font-weight: 600;
  text-align: left;
  padding: 0.65rem 0.9rem;
  border-bottom: 2px solid #e9ecef;
}

.users-table td {
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #e9ecef;
  color: #333;
  vertical-align: middle;
}

.users-table tr:last-child td { border-bottom: none; }
.users-table tr:hover td { background: #f8f9fa; }

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  padding: 0.35rem 0.75rem;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
  border-radius: 5px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-edit:hover { background: #ffc107; color: #333; }

.btn-delete {
  padding: 0.35rem 0.75rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-delete:hover:not(:disabled) { background: #f5c6cb; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

/* Loading / empty */
.loading-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #e0e0e0;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>
