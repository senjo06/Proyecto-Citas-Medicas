<template>
  <div class="home-view">
    <header class="page-header">
      <h1>Asignación de Citas Médicas</h1>
      <p class="subtitle">Módulo Anti-Condiciones de Carrera (Transacciones Pesimistas)</p>
    </header>

    <!-- Alertas -->
    <div v-if="appointmentStore.successMessage" class="alert success">
      ✅ {{ appointmentStore.successMessage }}
    </div>
    <div v-if="appointmentStore.error" class="alert error">
      ⚠️ {{ appointmentStore.error }}
    </div>

    <!-- Estado de carga -->
    <div v-if="appointmentStore.loading && appointmentStore.slots.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Consultando agenda de especialistas...</p>
    </div>

    <!-- Sin turnos -->
    <div v-else-if="!appointmentStore.loading && appointmentStore.slots.length === 0" class="empty-state">
      <p>No hay turnos disponibles para agendamiento en este momento.</p>
      <button class="btn-refresh" @click="appointmentStore.loadAvailableSlots()">
        🔄 Refrescar Agenda
      </button>
    </div>

    <!-- Grid de turnos -->
    <div v-else>
      <div class="toolbar">
        <span class="slot-count">{{ appointmentStore.slots.length }} turno(s) disponible(s)</span>
        <button class="btn-refresh" @click="appointmentStore.loadAvailableSlots()">
          🔄 Refrescar
        </button>
      </div>

      <div class="slots-grid">
        <div
          v-for="slot in appointmentStore.slots"
          :key="slot.id"
          class="doctor-card"
        >
          <div class="card-body">
            <h3>{{ slot.doctor_name }}</h3>
            <span class="specialty-tag">{{ slot.specialty }}</span>
            <div class="time-info">
              <p>📅 <strong>{{ slot.appointment_date }}</strong></p>
              <p>⏰ <strong>{{ slot.appointment_time }}</strong></p>
            </div>
          </div>
          <button
            class="btn-book"
            :disabled="appointmentStore.loading"
            @click="handleBooking(slot.id)"
          >
            {{ appointmentStore.loading ? 'Procesando...' : 'Reservar Turno' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppointmentStore } from '../stores/appointment.store';

const appointmentStore = useAppointmentStore();

// ID de usuario simulado para pruebas locales
const MOCK_USER_ID = 45;

onMounted(() => {
  appointmentStore.loadAvailableSlots();
});

const handleBooking = async (slotId: number) => {
  await appointmentStore.reserveSlot(slotId, MOCK_USER_ID);
};
</script>

<style scoped>
.home-view {
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

.alert.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Carga */
.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sin turnos */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.slot-count {
  color: #555;
  font-size: 0.9rem;
}

/* Grid de tarjetas */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.doctor-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.doctor-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

.card-body {
  padding: 1.25rem;
  flex: 1;
}

.card-body h3 {
  margin: 0 0 0.5rem;
  color: #1a1a2e;
  font-size: 1.05rem;
}

.specialty-tag {
  display: inline-block;
  background-color: #e8f0fe;
  color: #1a73e8;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

.time-info {
  color: #555;
  font-size: 0.88rem;
}

.time-info p {
  margin: 0.25rem 0;
}

.btn-book {
  width: 100%;
  padding: 0.75rem;
  background-color: #1a73e8;
  color: white;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-book:hover:not(:disabled) {
  background-color: #1557b0;
}

.btn-book:disabled {
  background-color: #b0bec5;
  cursor: not-allowed;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background-color: #f1f3f4;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background-color 0.2s;
}

.btn-refresh:hover {
  background-color: #e2e6ea;
}
</style>
