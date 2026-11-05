<template>
  <div class="schedules-view">
    <header class="page-header">
      <h1>Citas Programadas</h1>
      <p class="subtitle">Consulta las citas reservadas de cada doctor para saber su disponibilidad</p>
    </header>

    <div class="actions-bar">
      <select v-model="selectedDoctorId" @change="filterByDoctor" class="doctor-select">
        <option value="">Todos los doctores</option>
        <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
          {{ doctor.name }} - {{ doctor.specialty }}
        </option>
      </select>
      <button @click="refreshAppointments" class="btn-primary">
        🔄 Refrescar
      </button>
    </div>

    <div v-if="loading" class="loading">Cargando citas programadas...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="schedules-grid">
      <div v-if="groupedDoctors.length === 0" class="empty-state">
        <p>No hay citas programadas</p>
        <p class="text-muted">Las citas reservadas por los pacientes aparecerán aquí</p>
      </div>

      <div v-for="group in groupedDoctors" :key="group.doctor_name" class="schedule-card">
        <div class="card-header">
          <div>
            <h3>{{ group.doctor_name }}</h3>
            <span class="specialty">{{ group.specialty }}</span>
          </div>
          <div class="count-badge">
            {{ group.appointments.length }} cita{{ group.appointments.length !== 1 ? 's' : '' }}
          </div>
        </div>
        
        <div class="card-body">
          <div class="schedules-list">
            <div v-for="apt in group.appointments" :key="apt.id" class="schedule-item">
              <div class="appointment-header">
                <div class="appointment-date">
                  <strong>{{ formatDate(apt.appointment_date) }}</strong>
                  <span class="appointment-time">{{ formatTime(apt.appointment_time) }}</span>
                </div>
                <span class="status-badge-sm booked">Reservada</span>
              </div>
              <div v-if="apt.patient_name" class="patient-info">
                <div class="patient-avatar">{{ getInitials(apt.patient_name) }}</div>
                <div>
                  <div class="patient-name">{{ apt.patient_name }}</div>
                  <div class="patient-contact">{{ apt.patient_email || '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDoctorStore } from '../stores/doctor.store';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const doctorStore = useDoctorStore();

const selectedDoctorId = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const bookedAppointments = ref<any[]>([]);

interface AppointmentGroup {
  doctor_name: string;
  specialty: string;
  appointments: any[];
}

const doctors = computed(() => doctorStore.doctors);

// Agrupar citas por doctor
const groupedDoctors = computed<AppointmentGroup[]>(() => {
  const filtered = selectedDoctorId.value 
    ? bookedAppointments.value.filter(apt => {
        const doctor = doctors.value.find(d => d.name === apt.doctor_name);
        return doctor?.id === Number(selectedDoctorId.value);
      })
    : bookedAppointments.value;

  const map = new Map<string, AppointmentGroup>();
  
  filtered.forEach(apt => {
    if (!map.has(apt.doctor_name)) {
      map.set(apt.doctor_name, {
        doctor_name: apt.doctor_name,
        specialty: apt.specialty,
        appointments: []
      });
    }
    map.get(apt.doctor_name)!.appointments.push(apt);
  });
  
  // Ordenar citas dentro de cada doctor por fecha y hora
  map.forEach(group => {
    group.appointments.sort((a, b) => {
      const dateCompare = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.appointment_time.localeCompare(b.appointment_time);
    });
  });
  
  return Array.from(map.values());
});

onMounted(async () => {
  await doctorStore.fetchDoctors();
  await fetchBookedAppointments();
});

async function fetchBookedAppointments() {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(`${BASE_URL}/api/appointments/booked`);
    bookedAppointments.value = response.data.data || [];
  } catch (err: any) {
    error.value = err.message || 'Error al cargar las citas';
    console.error('Error fetching booked appointments:', err);
  } finally {
    loading.value = false;
  }
}

function filterByDoctor() {
  // El computed ya maneja el filtrado
}

async function refreshAppointments() {
  await fetchBookedAppointments();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatTime(time: string): string {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
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

.schedules-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  padding: 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.schedule-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.schedule-item-header strong {
  color: var(--color-text);
  font-size: 0.9rem;
}

.status-badge-sm {
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge-sm.active {
  background: var(--color-success-lt);
  color: var(--color-success);
}

.status-badge-sm.booked {
  background: #dbeafe;
  color: #1e40af;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.appointment-date {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.appointment-date strong {
  color: var(--color-text);
  font-size: 0.9rem;
}

.appointment-time {
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.patient-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-lt);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.patient-name {
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.85rem;
}

.patient-contact {
  color: var(--color-text-3);
  font-size: 0.75rem;
}

.count-badge {
  padding: 0.25rem 0.75rem;
  background: var(--color-primary-lt);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.schedule-item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--color-text-2);
}

.duration {
  color: var(--color-text-3);
  font-size: 0.8rem;
}

.card-footer {
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  display: none; /* Ocultar footer en vista de citas */
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
