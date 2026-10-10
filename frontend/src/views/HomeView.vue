<template>
  <div class="home-view">

    <!-- Encabezado -->
    <header class="page-header">
      <h1>Agenda de Turnos Médicos</h1>
      <p class="subtitle">
        Reserva tu turno de forma segura. El sistema utiliza
        <strong>bloqueo pesimista</strong> (<code>SELECT FOR UPDATE</code>)
        para evitar reservas duplicadas en tiempo real.
      </p>
    </header>

    <!-- Alerta de éxito (se cierra sola después de 4s) -->
    <transition name="slide-alert">
      <div v-if="appointmentStore.successMessage" class="alert alert-success" role="alert">
        <span class="alert-icon">✅</span>
        <span>{{ appointmentStore.successMessage }}</span>
        <button class="alert-close" @click="appointmentStore.successMessage = null" aria-label="Cerrar">×</button>
      </div>
    </transition>

    <!-- Alerta de error -->
    <transition name="slide-alert">
      <div v-if="appointmentStore.error" class="alert alert-error" role="alert">
        <span class="alert-icon">⚠️</span>
        <span>{{ appointmentStore.error }}</span>
        <button class="alert-close" @click="appointmentStore.error = null" aria-label="Cerrar">×</button>
      </div>
    </transition>

    <!-- Estado: cargando -->
    <div v-if="appointmentStore.loading && appointmentStore.slots.length === 0" class="state-box">
      <div class="spinner" aria-hidden="true"></div>
      <p>Consultando agenda de especialistas...</p>
    </div>

    <!-- Estado: sin turnos -->
    <div v-else-if="!appointmentStore.loading && appointmentStore.slots.length === 0" class="state-box">
      <span class="state-emoji">📭</span>
      <p>No hay turnos disponibles en este momento.</p>
      <button class="btn-outline" @click="appointmentStore.loadAvailableSlots()">
        🔄 Refrescar agenda
      </button>
    </div>

    <!-- Turnos disponibles -->
    <div v-else>
      <div class="toolbar">
        <div class="slot-badge">
          <span class="badge-dot"></span>
          {{ appointmentStore.slots.length }} turno{{ appointmentStore.slots.length !== 1 ? 's' : '' }} disponible{{ appointmentStore.slots.length !== 1 ? 's' : '' }}
        </div>
        <button class="btn-outline btn-sm" @click="appointmentStore.loadAvailableSlots()" :disabled="appointmentStore.loading">
          🔄 Refrescar
        </button>
      </div>

      <div class="slots-grid">
        <article
          v-for="slot in appointmentStore.slots"
          :key="slot.id"
          class="doctor-card"
        >
          <div class="card-header">
            <span class="specialty-badge">{{ slot.specialty }}</span>
          </div>
          <div class="card-body">
            <h3 class="doctor-name">{{ slot.doctor_name }}</h3>
            <div class="card-info">
              <div class="info-item">
                <span class="info-icon">📅</span>
                <span>{{ formatDate(slot.appointment_date) }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">⏰</span>
                <span>{{ formatTime(slot.appointment_time) }}</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button
              class="btn-book"
              :disabled="appointmentStore.loading"
              @click="handleBooking(slot.id)"
              :aria-label="`Reservar turno con ${slot.doctor_name}`"
            >
              <span v-if="!appointmentStore.loading">Reservar turno</span>
              <span v-else class="btn-loading">
                <span class="spinner-sm"></span> Procesando...
              </span>
            </button>
          </div>
        </article>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useAppointmentStore } from '../stores/appointment.store';

const appointmentStore = useAppointmentStore();

// ID de usuario simulado para pruebas locales (sin sistema de auth)
const MOCK_USER_ID = 45;

onMounted(() => {
  appointmentStore.loadAvailableSlots();
});

// Auto-cierra el mensaje de éxito después de 4 segundos
watch(() => appointmentStore.successMessage, (msg) => {
  if (msg) {
    setTimeout(() => { appointmentStore.successMessage = null; }, 4000);
  }
});

const handleBooking = async (slotId: number) => {
  await appointmentStore.reserveSlot(slotId, MOCK_USER_ID);
};

/**
 * Formatea una fecha ISO de PostgreSQL a DD/MM/YYYY
 * Divide en 'T' para evitar corrimientos por zona horaria
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Formatea hora HH:MM:SS a HH:MM hs
 */
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  return `${h}:${m} hs`;
};
</script>

<style scoped>
.home-view { width: 100%; }

/* ── Encabezado ─────────────────────── */
.page-header {
  margin-bottom: 1.75rem;
  text-align: center;
}
.page-header h1 {
  font-size: 1.9rem;
  color: #0d47a1;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #555;
  font-size: 0.92rem;
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.6;
}
.subtitle code {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* ── Alertas ────────────────────────── */
.alert {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.93rem;
  font-weight: 500;
}
.alert-success { background: #d4edda; color: #155724; border: 1px solid #b7dfbc; }
.alert-error   { background: #f8d7da; color: #721c24; border: 1px solid #f1b0b7; }
.alert-icon { font-size: 1.1rem; }
.alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  line-height: 1;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0 0.25rem;
}
.alert-close:hover { opacity: 1; }

.slide-alert-enter-active,
.slide-alert-leave-active { transition: all 0.25s ease; }
.slide-alert-enter-from { opacity: 0; transform: translateY(-8px); }
.slide-alert-leave-to   { opacity: 0; transform: translateY(-8px); }

/* ── Estados vacío/carga ────────────── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3.5rem 1rem;
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  color: #777;
}
.state-emoji { font-size: 2.5rem; }

/* ── Toolbar ────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.slot-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #555;
  font-weight: 500;
}
.badge-dot {
  width: 8px;
  height: 8px;
  background: #34a853;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ── Botones utilitarios ────────────── */
.btn-outline {
  padding: 0.5rem 1rem;
  background: white;
  color: #1a73e8;
  border: 1.5px solid #1a73e8;
  border-radius: 7px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-outline:hover:not(:disabled) { background: #e8f0fe; }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 0.38rem 0.85rem; font-size: 0.83rem; }

/* ── Grid de tarjetas ───────────────── */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.25rem;
}

.doctor-card {
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e8ecf0;
}
.doctor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.11);
}

.card-header {
  background: linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%);
  padding: 0.75rem 1.1rem;
}
.specialty-badge {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1557b0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-body {
  padding: 1rem 1.1rem;
  flex: 1;
}
.doctor-name {
  font-size: 1.05rem;
  color: #0d1b2a;
  margin-bottom: 0.75rem;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.88rem;
  color: #555;
}
.info-icon { font-size: 0.95rem; }

.card-footer {
  padding: 0.85rem 1.1rem;
  border-top: 1px solid #f0f4f8;
}

.btn-book {
  width: 100%;
  padding: 0.65rem;
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.btn-book:hover:not(:disabled) {
  background: linear-gradient(135deg, #1557b0 0%, #0d47a1 100%);
  box-shadow: 0 4px 12px rgba(26,115,232,0.35);
}
.btn-book:disabled { background: #b0bec5; cursor: not-allowed; box-shadow: none; }

/* Spinners */
.spinner {
  width: 38px;
  height: 38px;
  border: 4px solid #e0e0e0;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ─────────────────────── */
@media (max-width: 480px) {
  .page-header h1 { font-size: 1.5rem; }
  .slots-grid { grid-template-columns: 1fr; }
}
</style>
