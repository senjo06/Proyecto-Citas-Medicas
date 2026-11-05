<template>
  <div class="schedules-view">
    <header class="page-header">
      <h1>Horarios de Doctores</h1>
      <p class="subtitle">Gestiona los horarios y disponibilidad de cada doctor</p>
    </header>

    <div class="actions-bar">
      <select v-model="selectedDoctorId" @change="filterByDoctor" class="doctor-select">
        <option value="">Todos los doctores</option>
        <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
          {{ doctor.name }} - {{ doctor.specialty }}
        </option>
      </select>
      <button @click="showCreateModal = true" class="btn-primary">
        + Nuevo Horario
      </button>
    </div>

    <div v-if="scheduleStore.loading" class="loading">Cargando horarios...</div>
    <div v-else-if="scheduleStore.error" class="error">{{ scheduleStore.error }}</div>

    <div v-else class="schedules-grid">
      <div v-if="filteredSchedules.length === 0" class="empty-state">
        <p>No hay horarios configurados</p>
        <p class="text-muted">Agrega horarios para que los doctores puedan recibir citas</p>
      </div>

      <div v-for="schedule in filteredSchedules" :key="schedule.id" class="schedule-card">
        <div class="card-header">
          <div>
            <h3>{{ schedule.doctor_name }}</h3>
            <span class="specialty">{{ schedule.specialty }}</span>
          </div>
          <span :class="['status-badge', schedule.is_active ? 'active' : 'inactive']">
            {{ schedule.is_active ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="schedule-info">
            <div class="info-row">
              <strong>Día:</strong>
              <span>{{ schedule.day_name }}</span>
            </div>
            <div class="info-row">
              <strong>Horario:</strong>
              <span>{{ formatTime(schedule.start_time) }} - {{ formatTime(schedule.end_time) }}</span>
            </div>
            <div class="info-row">
              <strong>Duración citas:</strong>
              <span>{{ schedule.duration_minutes }} min</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button @click="editSchedule(schedule)" class="btn-secondary">Editar</button>
          <button @click="toggleActive(schedule)" class="btn-secondary">
            {{ schedule.is_active ? 'Desactivar' : 'Activar' }}
          </button>
          <button @click="confirmDelete(schedule)" class="btn-danger">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <h2>{{ showEditModal ? 'Editar Horario' : 'Nuevo Horario' }}</h2>
        
        <form @submit.prevent="showEditModal ? saveEdit() : createSchedule()">
          <div v-if="!showEditModal" class="form-group">
            <label>Doctor</label>
            <select v-model="formData.doctor_id" required>
              <option value="">Seleccionar doctor</option>
              <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                {{ doctor.name }} - {{ doctor.specialty }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Día de la semana</label>
            <select v-model.number="formData.day_of_week" required>
              <option :value="0">Domingo</option>
              <option :value="1">Lunes</option>
              <option :value="2">Martes</option>
              <option :value="3">Miércoles</option>
              <option :value="4">Jueves</option>
              <option :value="5">Viernes</option>
              <option :value="6">Sábado</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Hora inicio</label>
              <input type="time" v-model="formData.start_time" required />
            </div>
            <div class="form-group">
              <label>Hora fin</label>
              <input type="time" v-model="formData.end_time" required />
            </div>
          </div>

          <div class="form-group">
            <label>Duración de cita (minutos)</label>
            <input type="number" v-model.number="formData.duration_minutes" min="15" step="5" required />
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">
              {{ showEditModal ? 'Guardar Cambios' : 'Crear Horario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDoctorScheduleStore } from '../stores/doctor-schedule.store';
import { useDoctorStore } from '../stores/doctor.store';
import type { DoctorSchedule } from '../services/doctor-schedule.service';

const scheduleStore = useDoctorScheduleStore();
const doctorStore = useDoctorStore();

const selectedDoctorId = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingSchedule = ref<DoctorSchedule | null>(null);

const formData = ref({
  doctor_id: '',
  day_of_week: 1,
  start_time: '08:00',
  end_time: '12:00',
  duration_minutes: 30
});

const doctors = computed(() => doctorStore.doctors);

const filteredSchedules = computed(() => {
  if (!selectedDoctorId.value) return scheduleStore.schedules;
  return scheduleStore.schedules.filter(s => s.doctor_id === Number(selectedDoctorId.value));
});

onMounted(async () => {
  await scheduleStore.fetchAllSchedules();
  await doctorStore.fetchDoctors();
});

function filterByDoctor() {
  // El computed ya maneja el filtrado
}

function formatTime(time: string): string {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM
}

async function createSchedule() {
  try {
    await scheduleStore.createSchedule({
      doctor_id: Number(formData.value.doctor_id),
      day_of_week: formData.value.day_of_week,
      start_time: formData.value.start_time + ':00',
      end_time: formData.value.end_time + ':00',
      duration_minutes: formData.value.duration_minutes
    });
    closeModals();
    resetForm();
  } catch (error) {
    console.error('Error creando horario:', error);
  }
}

function editSchedule(schedule: DoctorSchedule) {
  editingSchedule.value = schedule;
  formData.value = {
    doctor_id: schedule.doctor_id.toString(),
    day_of_week: schedule.day_of_week,
    start_time: formatTime(schedule.start_time),
    end_time: formatTime(schedule.end_time),
    duration_minutes: schedule.duration_minutes
  };
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editingSchedule.value) return;
  
  try {
    await scheduleStore.updateSchedule(editingSchedule.value.id, {
      day_of_week: formData.value.day_of_week,
      start_time: formData.value.start_time + ':00',
      end_time: formData.value.end_time + ':00',
      duration_minutes: formData.value.duration_minutes
    });
    closeModals();
    resetForm();
  } catch (error) {
    console.error('Error actualizando horario:', error);
  }
}

async function toggleActive(schedule: DoctorSchedule) {
  try {
    await scheduleStore.updateSchedule(schedule.id, {
      is_active: !schedule.is_active
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
  }
}

async function confirmDelete(schedule: DoctorSchedule) {
  if (!confirm(`¿Eliminar horario de ${schedule.doctor_name} (${schedule.day_name})?`)) return;
  
  try {
    await scheduleStore.deleteSchedule(schedule.id);
  } catch (error) {
    console.error('Error eliminando horario:', error);
  }
}

function closeModals() {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingSchedule.value = null;
}

function resetForm() {
  formData.value = {
    doctor_id: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '12:00',
    duration_minutes: 30
  };
}
</script>

<style scoped>
.schedules-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-3);
  font-size: 0.9rem;
}

.actions-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.doctor-select {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.9rem;
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dk);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-3);
}

.error {
  color: var(--color-danger);
}

.schedules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}

.empty-state p {
  margin: 0.5rem 0;
}

.schedule-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.schedule-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.card-header h3 {
  font-size: 1.1rem;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.specialty {
  font-size: 0.85rem;
  color: var(--color-text-3);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: var(--color-success-lt);
  color: var(--color-success);
}

.status-badge.inactive {
  background: var(--color-border);
  color: var(--color-text-3);
}

.card-body {
  padding: 1.25rem;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.info-row strong {
  color: var(--color-text-2);
}

.info-row span {
  color: var(--color-text);
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.btn-secondary {
  flex: 1;
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-2);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-danger {
  flex: 1;
  padding: 0.5rem 1rem;
  background: var(--color-danger-lt);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: var(--color-danger);
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-2);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-actions button {
  flex: 1;
}

@media (max-width: 768px) {
  .schedules-grid {
    grid-template-columns: 1fr;
  }

  .actions-bar {
    flex-direction: column;
  }

  .doctor-select {
    width: 100%;
  }
}
</style>
