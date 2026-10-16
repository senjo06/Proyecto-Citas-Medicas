<template>
  <div class="booked-view">

    <!-- Encabezado -->
    <header class="page-header">
      <h1>Turnos Reservados</h1>
      <p class="subtitle">Lista de todos los turnos médicos agendados. Podés cancelar una reserva para liberarla.</p>
    </header>

    <!-- Alertas -->
    <transition name="slide-alert">
      <div v-if="successMessage" class="alert alert-success" role="alert">
        <span>{{ successMessage }}</span>
        <button class="alert-close" @click="successMessage = null">×</button>
      </div>
    </transition>
    <transition name="slide-alert">
      <div v-if="errorMessage" class="alert alert-error" role="alert">
        <span>{{ errorMessage }}</span>
        <button class="alert-close" @click="errorMessage = null">×</button>
      </div>
    </transition>

    <!-- Estado: cargando -->
    <div v-if="loading && bookings.length === 0" class="state-box">
      <div class="spinner"></div>
      <p>Cargando turnos reservados...</p>
    </div>

    <!-- Estado: sin reservas -->
    <div v-else-if="!loading && bookings.length === 0" class="state-box">
      <p>No hay turnos reservados todavía.</p>
      <button class="btn-outline" @click="loadBookings()">Refrescar</button>
    </div>

    <!-- Lista de reservas -->
    <div v-else>
      <div class="toolbar">
        <div class="slot-badge">
          <span class="badge-dot"></span>
          {{ bookings.length }} turno{{ bookings.length !== 1 ? 's' : '' }} reservado{{ bookings.length !== 1 ? 's' : '' }}
        </div>
        <button class="btn-outline btn-sm" @click="loadBookings()" :disabled="loading">
          Refrescar
        </button>
      </div>

      <!-- Tabla responsive -->
      <div class="card">
        <div class="table-wrapper">
          <table class="booked-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Doctor</th>
                <th>Especialidad</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Reservado el</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in bookings" :key="b.id">
                <td class="td-id">{{ b.id }}</td>
                <td class="td-doctor">
                  <div class="doctor-avatar">{{ initials(b.doctor_name) }}</div>
                  {{ b.doctor_name }}
                </td>
                <td>
                  <span class="specialty-badge">{{ b.specialty }}</span>
                </td>
                <td class="td-date">{{ formatDate(b.appointment_date) }}</td>
                <td class="td-time">{{ formatTime(b.appointment_time) }}</td>
                <td class="td-patient">
                  <button class="patient-btn" @click="openPatientModal(b)">
                    <div class="patient-avatar">{{ initials(b.patient_name ?? 'N A') }}</div>
                    <span>{{ b.patient_name ?? '—' }}</span>
                  </button>
                </td>
                <td class="td-phone">{{ b.patient_phone ?? '—' }}</td>
                <td class="td-email">{{ b.patient_email ?? '—' }}</td>
                <td class="td-booked">{{ formatDateTime(b.booked_at) }}</td>
                <td class="td-action">
                  <button
                    class="btn-cancel"
                    :disabled="loading"
                    @click="openCancelModal(b)"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-count">{{ bookings.length }} registro{{ bookings.length !== 1 ? 's' : '' }} en total</p>
      </div>
    </div>

    <!-- Modal detalle del paciente -->
    <Teleport to="body">
      <transition name="modal">
        <div
          v-if="patientModal.visible"
          class="modal-overlay"
          @click.self="patientModal.visible = false"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-modal-title"
        >
          <div class="modal-box">
            <div class="patient-modal-header">
              <div class="patient-modal-avatar">{{ initials(patientModal.name) }}</div>
              <div>
                <h3 id="patient-modal-title">{{ patientModal.name }}</h3>
                <span class="patient-role">Paciente</span>
              </div>
            </div>

            <div class="patient-modal-info">
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">{{ patientModal.email || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Teléfono</span>
                <span class="info-value">{{ patientModal.phone || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Doctor</span>
                <span class="info-value">{{ patientModal.doctorName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad</span>
                <span class="info-value">{{ patientModal.specialty }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha del turno</span>
                <span class="info-value">{{ patientModal.date }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hora</span>
                <span class="info-value">{{ patientModal.time }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reservado el</span>
                <span class="info-value">{{ patientModal.bookedAt }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-primary-sm" @click="patientModal.visible = false">Cerrar</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal cancelar reserva -->
    <Teleport to="body">
      <transition name="modal">
        <div
          v-if="cancelModal.visible"
          class="modal-overlay"
          @click.self="closeCancelModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div class="modal-box">
            <h3 id="modal-title">Cancelar reserva</h3>
            <p>¿Seguro que querés cancelar el turno con:</p>
            <div class="modal-detail">
              <strong>{{ cancelModal.doctorName }}</strong>
              <span class="modal-specialty">{{ cancelModal.specialty }}</span>
            </div>
            <p class="modal-sub">Fecha: {{ cancelModal.date }} &nbsp; Hora: {{ cancelModal.time }}</p>
            <p class="modal-warning">El turno volverá a estar disponible para otros pacientes.</p>
            <div class="modal-actions">
              <button class="btn-ghost" @click="closeCancelModal">Volver</button>
              <button class="btn-danger" :disabled="loading" @click="confirmCancel">
                <span v-if="!loading">Sí, cancelar</span>
                <span v-else class="btn-loading"><span class="spinner-sm"></span> Cancelando...</span>
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
import { AppointmentService, type BookedSlot } from '../services/appointment.service';

const bookings = ref<BookedSlot[]>([]);
const loading = ref(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

// Estado del modal paciente
const patientModal = ref({
  visible: false,
  name: '',
  email: '',
  phone: '',
  doctorName: '',
  specialty: '',
  date: '',
  time: '',
  bookedAt: ''
});

// Estado del modal cancelar
const cancelModal = ref({
  visible: false,
  appointmentId: 0,
  doctorName: '',
  specialty: '',
  date: '',
  time: ''
});

onMounted(() => loadBookings());

// Auto-cierra el mensaje de éxito después de 4s
watch(successMessage, (msg) => {
  if (msg) setTimeout(() => { successMessage.value = null; }, 4000);
});

const loadBookings = async () => {
  loading.value = true;
  try {
    const response = await AppointmentService.fetchBookedSlots();
    bookings.value = response.data;
  } catch {
    errorMessage.value = 'No se pudo cargar la lista de reservas.';
  } finally {
    loading.value = false;
  }
};

const openPatientModal = (b: BookedSlot) => {
  patientModal.value = {
    visible: true,
    name: b.patient_name ?? '—',
    email: b.patient_email ?? '—',
    phone: b.patient_phone ?? '—',
    doctorName: b.doctor_name,
    specialty: b.specialty,
    date: formatDate(b.appointment_date),
    time: formatTime(b.appointment_time),
    bookedAt: formatDateTime(b.booked_at)
  };
};

const openCancelModal = (b: BookedSlot) => {
  cancelModal.value = {
    visible: true,
    appointmentId: b.id,
    doctorName: b.doctor_name,
    specialty: b.specialty,
    date: formatDate(b.appointment_date),
    time: formatTime(b.appointment_time)
  };
};

const closeCancelModal = () => {
  cancelModal.value = { ...cancelModal.value, visible: false };
};

const confirmCancel = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    await AppointmentService.cancelBooking(cancelModal.value.appointmentId);
    successMessage.value = `Turno con ${cancelModal.value.doctorName} cancelado. El turno vuelve a estar disponible.`;
    closeCancelModal();
    await loadBookings();
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error || 'Error al cancelar el turno.';
    closeCancelModal();
  } finally {
    loading.value = false;
  }
};

// Helpers
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  return `${h}:${m} hs`;
};
const formatDateTime = (dtStr: string): string => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() ?? '';
  const last  = (parts.length >= 3 ? parts[2] : parts[1])?.[0]?.toUpperCase() ?? '';
  return first + last;
};
</script>

<style scoped>
.booked-view { width: 100%; }

/* Encabezado */
.page-header { margin-bottom: 1.75rem; text-align: center; }
.page-header h1 { font-size: 1.9rem; color: #1e293b; margin-bottom: 0.4rem; }
.subtitle { color: #666; font-size: 0.92rem; }

/* Alertas */
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

/* Estado */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 3.5rem 1rem;
  background: white; border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); color: #777;
}
.state-emoji { font-size: 2.5rem; }

/* Toolbar */
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.slot-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: #555; font-weight: 500; }
.badge-dot { width: 8px; height: 8px; background: #e53935; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

/* Card / tabla */
.card { background: white; border-radius: 8px; box-shadow: none; padding: 1.25rem; border: 1px solid #e5e7eb; }
.table-wrapper { overflow-x: auto; border-radius: 8px; }
.booked-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 900px; }
.booked-table th { background: #f9fafb; color: #555; font-weight: 600; text-align: left; padding: 0.7rem 0.85rem; border-bottom: 2px solid #e9ecef; white-space: nowrap; }
.booked-table td { padding: 0.65rem 0.85rem; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
.booked-table tr:last-child td { border-bottom: none; }
.booked-table tr:hover td { background: #fafbff; }

.td-id { color: #bbb; font-size: 0.8rem; width: 32px; }
.td-doctor, .td-patient { display: flex; align-items: center; gap: 0.55rem; font-weight: 500; white-space: nowrap; }
.doctor-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1e293b); color: white; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.patient-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #16a34a, #15803d); color: white; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.specialty-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
.td-date, .td-time { color: #555; white-space: nowrap; }
.td-email { color: #888; font-size: 0.83rem; }
.td-booked { color: #aaa; font-size: 0.82rem; white-space: nowrap; }
.table-count { font-size: 0.8rem; color: #aaa; margin-top: 0.75rem; text-align: right; }

/* Botón cancelar */
.btn-cancel {
  padding: 0.35rem 0.75rem;
  background: #ffeef0; color: #b91c1c;
  border: 1px solid #ef9a9a; border-radius: 6px;
  font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: all 0.18s; white-space: nowrap;
}
.btn-cancel:hover:not(:disabled) { background: #ffcdd2; border-color: #e57373; }
.btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

/* Botones generales */
.btn-outline { padding: 0.5rem 1rem; background: white; color: #2563eb; border: 1.5px solid #2563eb; border-radius: 7px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
.btn-outline:hover:not(:disabled) { background: #eff6ff; }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 0.38rem 0.85rem; font-size: 0.83rem; }
.btn-ghost { padding: 0.65rem 1.2rem; background: transparent; color: #555; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.93rem; cursor: pointer; transition: all 0.2s; }
.btn-ghost:hover { background: #f5f5f5; }
.btn-danger { padding: 0.65rem 1.4rem; background: #dc2626; color: white; border: none; border-radius: 8px; font-size: 0.93rem; font-weight: 600; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.4rem; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { background: #ef9a9a; cursor: not-allowed; }
.btn-loading { display: flex; align-items: center; gap: 0.4rem; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box { background: white; border-radius: 16px; padding: 2rem; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.modal-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.modal-box h3 { font-size: 1.2rem; margin-bottom: 0.5rem; color: #111827; }
.modal-box p { font-size: 0.93rem; color: #555; }
.modal-detail { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; margin: 0.75rem 0; padding: 0.75rem; background: #f9fafb; border-radius: 8px; }
.modal-detail strong { font-size: 1rem; color: #111827; }
.modal-specialty { font-size: 0.78rem; background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.6rem; border-radius: 20px; font-weight: 700; text-transform: uppercase; }
.modal-sub { font-size: 0.88rem; color: #666; margin-bottom: 0.5rem; }
.modal-warning { color: #e65100; font-size: 0.82rem; margin-top: 0.35rem; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: center; }
.modal-enter-active, .modal-leave-active { transition: all 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.92); }

/* Spinners */
.spinner { width: 38px; height: 38px; border: 4px solid #e0e0e0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.75s linear infinite; }
.spinner-sm { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .page-header h1 { font-size: 1.5rem; }
}
</style>

