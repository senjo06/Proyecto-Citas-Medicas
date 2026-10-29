<template>
  <div class="home-view">

    <header class="page-header">
      <div class="page-heading">
        <span class="eyebrow">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v18M3 12h18" />
          </svg>
          CUIDAMOS DE VOS
        </span>
        <h1>Encontrá al especialista ideal</h1>
        <p class="subtitle">Elegí un profesional y consultá los horarios disponibles para tu próxima cita.</p>
      </div>
      <div class="specialist-count">
        <span class="count-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6m3-3h-6" />
          </svg>
        </span>
        <span><strong>{{ doctors.length }}</strong> especialistas</span>
      </div>
    </header>

    <!-- Alertas -->
    <transition name="slide-alert">
      <div v-if="successMsg" class="alert alert-success">
        {{ successMsg }}
        <button class="alert-close" @click="successMsg = null">×</button>
      </div>
    </transition>
    <transition name="slide-alert">
      <div v-if="errorMsg" class="alert alert-error">
        {{ errorMsg }}
        <button class="alert-close" @click="errorMsg = null">×</button>
      </div>
    </transition>

    <!-- Recordatorio: turno mañana -->
    <div v-if="reminder.length > 0" class="reminder-banner">
      <span class="reminder-icon">🔔</span>
      <div class="reminder-content">
        <strong>Recordatorio:</strong> Mañana tenés
        {{ reminder.length === 1 ? 'un turno' : reminder.length + ' turnos' }}:
        <span v-for="(r, i) in reminder" :key="r.id">
          {{ r.doctor_name }} ({{ r.specialty }}) a las {{ formatTime(r.appointment_time) }}{{ i < reminder.length - 1 ? ', ' : '.' }}
        </span>
      </div>
    </div>

    <!-- Mis turnos activos -->
    <div v-if="myAppointments.length > 0" class="my-appointments">
      <h2 class="my-title">Mis turnos reservados</h2>
      <div class="my-list">
        <div v-for="apt in myAppointments" :key="apt.id" class="my-item">
          <div class="my-item-info">
            <span class="my-doctor">{{ apt.doctor_name ?? '—' }}</span>
            <span class="specialty-badge">{{ apt.specialty }}</span>
            <span class="my-date">{{ formatDate(apt.appointment_date) }} — {{ formatTime(apt.appointment_time) }}</span>
          </div>
          <div class="my-item-actions">
            <button class="btn-change" @click="changeTurn(apt)">Cambiar turno</button>
            <button class="btn-cancel-my" :disabled="busy" @click="cancelTurn(apt.id)">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cargando primera vez -->
    <div v-if="loading && allDoctors.length === 0" class="state-box">
      <div class="spinner"></div>
      <p>Cargando especialistas...</p>
    </div>

    <!-- Sin doctores -->
    <div v-else-if="!loading && allDoctors.length === 0" class="state-box">
      <p>No hay especialistas disponibles.</p>
      <button class="btn-outline" @click="loadAll()">Refrescar</button>
    </div>

    <!-- Lista de doctores -->
    <div v-else-if="!selectedDoctorName">
      <div class="doctors-grid">
        <button
          v-for="doc in doctors"
          :key="doc.name"
          type="button"
          class="doctor-card"
          @click="openDoctor(doc.name)"
          :aria-label="`Consultar horarios de ${doc.name}, ${doc.specialty}`"
        >
          <div class="doctor-card-top">
            <div class="doctor-avatar">{{ initials(doc.name) }}</div>
            <span class="doctor-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </span>
          </div>
          <div class="doctor-info">
            <h3>{{ doc.name }}</h3>
            <span class="specialty-badge">{{ doc.specialty }}</span>
          </div>
          <span class="doctor-card-action">
            Consultar horarios
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </span>
        </button>
      </div>
    </div>

    <!-- Calendario del doctor -->
    <div v-else class="calendar-view">

      <div class="breadcrumb">
        <button class="btn-back" @click="selectedDoctorName = null">‹ Volver</button>
        <span>/</span>
        <span>{{ selectedDoctorName }}</span>
      </div>

      <div class="doctor-header-card">
        <div class="doctor-avatar lg">{{ initials(selectedDoctorName) }}</div>
        <div>
          <h2>{{ selectedDoctorName }}</h2>
          <span class="specialty-badge">{{ selectedSpecialty }}</span>
        </div>
      </div>

      <div class="calendar-layout">

        <!-- Calendario -->
        <div class="calendar-card">
          <div class="cal-nav">
            <button class="cal-nav-btn" @click="prevMonth">&#8249;</button>
            <span class="cal-month-label">{{ monthLabel }}</span>
            <button class="cal-nav-btn" @click="nextMonth">&#8250;</button>
          </div>

          <div class="cal-weekdays">
            <span v-for="d in ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']" :key="d">{{ d }}</span>
          </div>

          <div class="cal-grid">
            <div
              v-for="(cell, i) in calCells"
              :key="i"
              class="cal-cell"
              :class="{
                empty:    !cell.day,
                past:     cell.past,
                sunday:   cell.sunday,
                available: cell.hasSlots,
                selected:  cell.day === selDay && cell.month === selMonth && cell.year === selYear
              }"
              @click="cell.hasSlots ? pickDay(cell) : null"
            >
              <span v-if="cell.day">{{ cell.day }}</span>
              <span v-if="cell.sunday && cell.day" class="cal-tag">C</span>
              <span v-else-if="cell.hasSlots" class="cal-dot"></span>
            </div>
          </div>

          <div class="cal-legend">
            <span class="leg"><span class="leg-dot avail"></span>Disponible</span>
            <span class="leg"><span class="leg-dot sel"></span>Seleccionado</span>
            <span class="leg"><span class="leg-dot closed"></span>Cerrado</span>
          </div>
        </div>

        <!-- Horarios -->
        <div class="slots-panel">
          <div v-if="!selDay" class="slots-empty">
            <p>Seleccioná un día para ver los horarios disponibles.</p>
          </div>
          <div v-else>
            <h3 class="slots-title">Horarios — {{ selDateLabel }}</h3>
            <div v-if="daySlots.length === 0" class="slots-empty">
              <p>No hay turnos disponibles para este día.</p>
            </div>
            <div v-else class="slots-list">
              <div v-for="slot in daySlots" :key="slot.id" class="slot-item">
                <span class="slot-time">{{ formatTime(slot.appointment_time) }}</span>
                <button class="btn-book" :disabled="busy" @click="book(slot.id)">
                  <span v-if="!busy">Reservar</span>
                  <span v-else class="spinner-sm"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal: ya tiene un turno en ese horario -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="conflictVisible" class="modal-overlay" @click.self="conflictVisible = false">
          <div class="modal-box">
            <h3>Ya tenés un turno a esa hora</h3>
            <p>No podés reservar dos turnos para la misma fecha y hora.</p>
            <p class="modal-warn">Podés cancelarlo y tomar el nuevo, o mantener el actual.</p>
            <div class="modal-actions">
              <button class="btn-ghost" @click="conflictVisible = false">Mantener actual</button>
              <button class="btn-danger" :disabled="busy" @click="cancelConflictAndBook()">
                <span v-if="!busy">Cancelar y cambiar</span>
                <span v-else class="spinner-sm"></span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

// ── Tipos ─────────────────────────────────────────────────────────
interface Slot {
  id: number;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
}
interface DoctorInfo {
  name: string;
  specialty: string;
  available: number;
}

// ── Estado ────────────────────────────────────────────────────────
const authStore  = useAuthStore();
const userId     = authStore.user!.id;
const BASE       = import.meta.env.VITE_API_URL ?? '';

const loading    = ref(false);
const busy       = ref(false);
const successMsg = ref<string | null>(null);
const errorMsg   = ref<string | null>(null);

const allSlots       = ref<Slot[]>([]);
const allDoctors     = ref<DoctorInfo[]>([]);
const myAppointments = ref<Slot[]>([]);
const reminder       = ref<Slot[]>([]);

// ── Conflicto ─────────────────────────────────────────────────────
const conflictVisible    = ref(false);
const conflictExistingId = ref<number | null>(null);
const pendingSlotId      = ref<number | null>(null);

// ── Doctor seleccionado ───────────────────────────────────────────
const selectedDoctorName = ref<string | null>(null);
const selectedSpecialty = computed(() =>
  allDoctors.value.find((d: any) => (d.doctor_name ?? d.name) === selectedDoctorName.value)?.specialty ?? ''
);

const doctors = computed<DoctorInfo[]>(() =>
  allDoctors.value.map((d: any) => ({
    name:      d.doctor_name ?? d.name ?? '',
    specialty: d.specialty ?? '',
    available: allSlots.value.filter(s => s.doctor_name === (d.doctor_name ?? d.name)).length
  }))
);

// ── Calendario ────────────────────────────────────────────────────
const today = new Date();
const calYear  = ref(today.getFullYear());
const calMonth = ref(today.getMonth());
const selDay   = ref<number | null>(null);
const selMonth = ref(today.getMonth());
const selYear  = ref(today.getFullYear());

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthLabel  = computed(() => `${MONTH_NAMES[calMonth.value]} ${calYear.value}`);

// Días con turnos del doctor seleccionado
const availDays = computed(() => {
  if (!selectedDoctorName.value) return new Set<string>();
  const set = new Set<string>();
  allSlots.value
    .filter(s => s.doctor_name === selectedDoctorName.value)
    .forEach(s => set.add(s.appointment_date.split('T')[0]));
  return set;
});

const calCells = computed(() => {
  const y = calYear.value, m = calMonth.value;
  const firstDay    = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayMs     = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const cells: { day: number|null; month: number; year: number; hasSlots: boolean; past: boolean; sunday: boolean }[] = [];

  for (let i = 0; i < firstDay; i++)
    cells.push({ day: null, month: m, year: y, hasSlots: false, past: false, sunday: false });

  for (let d = 1; d <= daysInMonth; d++) {
    const dt  = new Date(y, m, d);
    const dow = dt.getDay();
    const str = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    // Un día es "pasado" si es anterior a hoy, o es domingo
    // Para hoy: solo lo marcamos disponible si hay slots (el backend ya filtra por hora)
    cells.push({
      day: d, month: m, year: y,
      hasSlots: availDays.value.has(str),
      past:   dt.getTime() < todayMs || dow === 0,
      sunday: dow === 0
    });
  }
  return cells;
});

const prevMonth = () => { if (calMonth.value === 0) { calMonth.value = 11; calYear.value--; } else calMonth.value--; selDay.value = null; };
const nextMonth = () => { if (calMonth.value === 11) { calMonth.value = 0; calYear.value++; } else calMonth.value++; selDay.value = null; };
const pickDay   = (cell: { day: number | null; month: number; year: number }) => {
  if (cell.day === null) return;
  selDay.value = cell.day;
  selMonth.value = cell.month;
  selYear.value = cell.year;
};

// Turnos del día seleccionado
const daySlots = computed(() => {
  if (!selDay.value || !selectedDoctorName.value) return [];
  const str = `${selYear.value}-${String(selMonth.value+1).padStart(2,'0')}-${String(selDay.value).padStart(2,'0')}`;
  return allSlots.value
    .filter(s => s.doctor_name === selectedDoctorName.value && s.appointment_date.split('T')[0] === str)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
});

const selDateLabel = computed(() =>
  selDay.value ? `${String(selDay.value).padStart(2,'0')}/${String(selMonth.value+1).padStart(2,'0')}/${selYear.value}` : ''
);

// ── Carga de datos ────────────────────────────────────────────────
const loadAll = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(`${BASE}/api/appointments/available`);
    console.log('Doctores cargados:', data.doctors?.length, data);
    allSlots.value   = [];
    allDoctors.value = data.doctors ?? [];
  } catch (e: any) {
    console.error('Error loadAll:', e);
    errorMsg.value = 'No se pudo cargar la agenda.';
  }
  finally { loading.value = false; }
};

const loadDoctorSlots = async (doctorName: string) => {
  loading.value = true;
  try {
    const { data } = await axios.get(`${BASE}/api/appointments/doctor`, { params: { name: doctorName } });
    // Reemplaza solo los slots de este doctor
    allSlots.value = [
      ...allSlots.value.filter(s => s.doctor_name !== doctorName),
      ...(data.data ?? [])
    ];
  } catch { errorMsg.value = 'No se pudo cargar la agenda del doctor.'; }
  finally { loading.value = false; }
};

const loadMine = async () => {
  try {
    const { data } = await axios.get(`${BASE}/api/appointments/my`, { params: { userId } });
    myAppointments.value = data.data ?? [];
  } catch { myAppointments.value = []; }
};

const loadReminder = async () => {
  try {
    const { data } = await axios.get(`${BASE}/api/appointments/reminder`, { params: { userId } });
    reminder.value = data.data ?? [];
  } catch { reminder.value = []; }
};

onMounted(() => { loadAll(); loadMine(); loadReminder(); });

// Auto-cierra mensajes
watch(successMsg, v => { if (v) setTimeout(() => successMsg.value = null, 4000); });

// ── Acciones ──────────────────────────────────────────────────────
const openDoctor = async (name: string) => {
  selectedDoctorName.value = name;
  selDay.value = null;
  calYear.value  = today.getFullYear();
  calMonth.value = today.getMonth();
  // Carga los slots de este doctor bajo demanda
  await loadDoctorSlots(name);
};

const book = async (slotId: number) => {
  busy.value = true;
  errorMsg.value = null;
  pendingSlotId.value = slotId;
  try {
    const { data } = await axios.post(`${BASE}/api/appointments/book`, { appointmentId: slotId, userId });
    successMsg.value = data.message;
    // Quitar el slot del array local — sin recargar todo
    allSlots.value = allSlots.value.filter(s => s.id !== slotId);
    await loadMine();
  } catch (err: any) {
    const d = err.response?.data;
    if (d?.code === 'YA_TIENE_TURNO') {
      conflictExistingId.value = d.existingId;
      conflictVisible.value    = true;
    } else {
      errorMsg.value = d?.error || 'Error al reservar.';
    }
  } finally { busy.value = false; }
};

const cancelTurn = async (appointmentId: number, reason: 'cancel' | 'change' | 'silent' = 'cancel') => {
  busy.value = true;
  errorMsg.value = null;
  const apt = myAppointments.value.find(a => a.id === appointmentId);
  try {
    await axios.delete(`${BASE}/api/appointments/${appointmentId}/cancel`);
    // Solo notificar al admin si no es una cancelación silenciosa (interna del sistema)
    if (apt && reason !== 'silent') {
      const action = reason === 'change'
        ? `cambió su turno con ${apt.doctor_name} (${apt.specialty}) del ${formatDate(apt.appointment_date)} a las ${formatTime(apt.appointment_time)} por otro horario.`
        : `canceló su turno con ${apt.doctor_name} (${apt.specialty}) del ${formatDate(apt.appointment_date)} a las ${formatTime(apt.appointment_time)}.`;
      await axios.post(`${BASE}/api/notifications`, {
        userId,
        userName: authStore.user?.name ?? '',
        message: `${authStore.user?.name} ${action}`
      });
    }
    if (apt) {
      allSlots.value.push(apt);
      allSlots.value.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.appointment_time.localeCompare(b.appointment_time));
    }
    myAppointments.value = myAppointments.value.filter(a => a.id !== appointmentId);
    if (reason === 'cancel') successMsg.value = 'Turno cancelado correctamente.';
    if (reason === 'change') successMsg.value = 'Turno liberado. Seleccioná el nuevo horario.';
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'Error al cancelar.';
  } finally { busy.value = false; }
};

const cancelConflictAndBook = async () => {
  if (!conflictExistingId.value || !pendingSlotId.value) return;
  // 'silent' — no notifica al admin, es parte del flujo automático de cambio
  await cancelTurn(conflictExistingId.value, 'silent');
  conflictVisible.value = false;
  await book(pendingSlotId.value);
};

const changeTurn = async (apt: Slot) => {
  await cancelTurn(apt.id, 'change');
  openDoctor(apt.doctor_name);
};

// ── Helpers ───────────────────────────────────────────────────────
const formatDate = (s: string) => { const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const formatTime = (t: string) => { const [h,m] = t.split(':'); return `${h}:${m} hs`; };
const initials = (name: string) => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? '').toUpperCase() + ((p.length >= 3 ? p[2] : p[1])?.[0] ?? '').toUpperCase();
};
</script>

<style scoped>
/* ── Reset de estilos heredados del diseño anterior ── */
.home-view { width: 100%; max-width: 1100px; margin: 0 auto; }
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 2rem 2.1rem;
  border: 1px solid #dceae9;
  border-radius: 18px;
  background:
    radial-gradient(ellipse at 90% 0%, rgba(20, 184, 166, 0.12), transparent 38%),
    linear-gradient(120deg, #ffffff 0%, #f2fbfa 100%);
  box-shadow: 0 8px 24px rgba(15, 58, 71, 0.045);
}
.page-heading { max-width: 650px; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.12em;
}
.eyebrow svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; }
.page-header h1 { font-size: clamp(1.65rem, 3vw, 2.15rem); font-weight: 700; letter-spacing: -0.04em; color: #12313a; margin-bottom: 0.45rem; }
.subtitle { font-size: 0.96rem; color: #647b80; max-width: 520px; }
.specialist-count {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-shrink: 0;
  padding: 0.7rem 0.9rem;
  border: 1px solid #dceae9;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  color: #527077;
  font-size: 0.82rem;
}
.specialist-count strong { color: #173c43; font-size: 1rem; }
.count-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: #e8f7f5; color: #0f8b83; }
.count-icon svg { width: 19px; height: 19px; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

/* Alertas */
.alert { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.9rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.88rem; font-weight: 500; }
.alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.alert-close { background: none; border: none; font-size: 1rem; cursor: pointer; opacity: 0.5; color: inherit; }
.alert-close:hover { opacity: 1; }
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.2s; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-6px); }

/* Recordatorio */
.reminder-banner {
  display: flex; align-items: flex-start; gap: 0.75rem;
  background: #fffbeb; border: 1px solid #fcd34d;
  border-radius: 8px; padding: 0.85rem 1rem;
  margin-bottom: 1.25rem; font-size: 0.88rem; color: #92400e;
}
.reminder-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
.reminder-content { line-height: 1.5; }
.reminder-content strong { font-weight: 700; }

/* Mis turnos */
.my-appointments { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem 1.1rem; margin-bottom: 1.25rem; }
.my-title { font-size: 0.83rem; font-weight: 600; color: #1d4ed8; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.4px; }
.my-list { display: flex; flex-direction: column; gap: 0.5rem; }
.my-item { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.7rem 0.9rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.my-item-info { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.my-doctor { font-weight: 600; color: #111827; font-size: 0.88rem; }
.my-date { font-size: 0.8rem; color: #6b7280; }
.my-item-actions { display: flex; gap: 0.4rem; }
.btn-change { padding: 0.3rem 0.7rem; background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; border-radius: 5px; font-size: 0.8rem; font-weight: 500; cursor: pointer; }
.btn-change:hover { background: #fef3c7; }
.btn-cancel-my { padding: 0.3rem 0.7rem; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 5px; font-size: 0.8rem; font-weight: 500; cursor: pointer; }
.btn-cancel-my:hover:not(:disabled) { background: #fee2e2; }
.btn-cancel-my:disabled { opacity: 0.4; cursor: not-allowed; }

/* Estado */
.state-box { display: flex; flex-direction: column; align-items: center; gap: 0.65rem; padding: 3rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px; color: #9ca3af; font-size: 0.9rem; }

/* Lista doctores */
.doctors-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.doctor-card {
  min-width: 0;
  min-height: 198px;
  padding: 1.15rem 1.2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  color: inherit;
  background: #fff;
  border: 1px solid #e4e9ed;
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(19, 44, 57, 0.035);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.doctor-card:hover { transform: translateY(-3px); border-color: #9bd5d0; box-shadow: 0 12px 28px rgba(15, 84, 91, 0.1); }
.doctor-card:focus-visible { outline: 3px solid rgba(13, 148, 136, 0.35); outline-offset: 3px; }
.doctor-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.doctor-avatar { width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0; background: linear-gradient(145deg, #e8f7f5, #d7eeec); color: #0f766e; font-size: 0.95rem; font-weight: 750; display: flex; align-items: center; justify-content: center; border: 1px solid #d5ece9; }
.doctor-arrow { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid #e8edef; border-radius: 50%; color: #80969a; transition: background 0.18s ease, color 0.18s ease; }
.doctor-arrow svg, .doctor-card-action svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.doctor-card:hover .doctor-arrow { color: #fff; background: #0f8b83; border-color: #0f8b83; }
.doctor-avatar.lg { width: 52px; height: 52px; font-size: 1.1rem; }
.doctor-info { flex: 1; min-width: 0; }
.doctor-info h3 { font-size: 1rem; font-weight: 650; color: #18343c; margin-bottom: 0.55rem; overflow-wrap: anywhere; }
.doctor-card-action { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: auto; padding-top: 0.9rem; color: #0f8179; font-size: 0.8rem; font-weight: 650; }
.doctor-card-action svg { transition: transform 0.18s ease; }
.doctor-card:hover .doctor-card-action svg { transform: translateX(3px); }

.specialty-badge { display: inline-block; max-width: 100%; background: #f0f7f7; color: #487176; font-size: 0.68rem; font-weight: 650; padding: 0.25rem 0.55rem; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.055em; border: 1px solid #e0eeee; overflow-wrap: anywhere; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1rem; font-size: 0.83rem; color: #9ca3af; }
.btn-back { background: none; border: none; color: #2563eb; font-size: 0.83rem; font-weight: 500; cursor: pointer; padding: 0; }
.btn-back:hover { text-decoration: underline; }

/* Doctor header */
.doctor-header-card { display: flex; align-items: center; gap: 0.9rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem 1.1rem; margin-bottom: 1.1rem; }
.doctor-header-card h2 { font-size: 1rem; color: #111827; margin-bottom: 0.25rem; }

/* Layout calendario */
.calendar-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.25rem; align-items: start; }
.calendar-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.1rem; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
.cal-month-label { font-size: 0.9rem; font-weight: 600; color: #111827; }
.cal-nav-btn { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; width: 28px; height: 28px; font-size: 1rem; cursor: pointer; color: #374151; display: flex; align-items: center; justify-content: center; }
.cal-nav-btn:hover { background: #f3f4f6; border-color: #d1d5db; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 0.3rem; }
.cal-weekdays span { text-align: center; font-size: 0.66rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; padding: 0.2rem 0; }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
.cal-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 5px; font-size: 0.83rem; color: #374151; position: relative; transition: all 0.1s; }
.cal-cell.empty  { pointer-events: none; }
.cal-cell.past   { color: #d1d5db; pointer-events: none; }
.cal-cell.sunday { color: #fca5a5; pointer-events: none; }
.cal-cell.available { cursor: pointer; font-weight: 600; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; }
.cal-cell.available:hover { background: #dbeafe; }
.cal-cell.selected { background: #2563eb !important; color: white !important; font-weight: 700; border-color: #2563eb !important; }
.cal-dot { width: 4px; height: 4px; background: #2563eb; border-radius: 50%; position: absolute; bottom: 2px; }
.cal-cell.selected .cal-dot { background: white; }
.cal-tag { font-size: 0.48rem; color: #ef4444; font-weight: 700; position: absolute; bottom: 2px; letter-spacing: 0; }
.cal-legend { display: flex; gap: 0.75rem; margin-top: 0.75rem; justify-content: center; flex-wrap: wrap; }
.leg { display: flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: #9ca3af; }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; }
.leg-dot.avail  { background: #2563eb; }
.leg-dot.sel    { background: #2563eb; box-shadow: 0 0 0 2px white, 0 0 0 3px #2563eb; }
.leg-dot.closed { background: #fee2e2; border: 1px solid #fca5a5; }

/* Panel horarios */
.slots-panel { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem; min-height: 220px; }
.slots-empty { display: flex; align-items: center; justify-content: center; height: 160px; color: #9ca3af; font-size: 0.88rem; text-align: center; }
.slots-title { font-size: 0.88rem; font-weight: 600; color: #374151; margin-bottom: 0.9rem; }
.slots-list { display: flex; flex-direction: column; gap: 0.5rem; }
.slot-item { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0.9rem; border: 1px solid #e5e7eb; border-radius: 6px; transition: border-color 0.15s; }
.slot-item:hover { border-color: #93c5fd; }
.slot-time { font-size: 1.05rem; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
.btn-book { padding: 0.4rem 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-book:hover:not(:disabled) { background: #1d4ed8; }
.btn-book:disabled { background: #93c5fd; cursor: not-allowed; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box { background: white; border-radius: 10px; padding: 1.75rem; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.modal-box h3 { font-size: 1.05rem; color: #111827; margin-bottom: 0.5rem; }
.modal-box p { font-size: 0.88rem; color: #6b7280; }
.modal-warn { color: #b45309; font-size: 0.82rem; margin-top: 0.3rem; }
.modal-actions { display: flex; gap: 0.65rem; margin-top: 1.25rem; justify-content: center; }
.btn-ghost { padding: 0.55rem 1.1rem; background: transparent; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.88rem; cursor: pointer; }
.btn-ghost:hover { background: #f9fafb; }
.btn-danger { padding: 0.55rem 1.25rem; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }
.modal-enter-active, .modal-leave-active { transition: all 0.18s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.95); }

/* Botón outline */
.btn-outline { padding: 0.45rem 0.9rem; background: white; color: #2563eb; border: 1px solid #93c5fd; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
.btn-outline:hover { background: #eff6ff; }

/* Spinners */
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner-sm { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .doctors-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 860px) { .calendar-layout { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 480px) {
  .page-header { align-items: flex-start; flex-direction: column; gap: 1rem; padding: 1.35rem; margin-bottom: 1.25rem; border-radius: 14px; }
  .page-header h1 { font-size: 1.55rem; }
  .subtitle { font-size: 0.9rem; }
  .specialist-count { padding: 0.45rem 0.65rem; }
  .count-icon { width: 31px; height: 31px; }
  .doctors-grid { grid-template-columns: 1fr; gap: 0.75rem; }
  .doctor-card { min-height: 172px; }
  .my-appointments { padding: 0.85rem; }
  .my-item { align-items: flex-start; }
  .my-item-actions { width: 100%; }
  .my-item-actions button { flex: 1; }
  .calendar-card, .slots-panel { padding: 0.85rem; min-width: 0; }
  .cal-legend { gap: 0.5rem; }
  .modal-actions { flex-direction: column-reverse; }
  .modal-actions button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .doctor-card, .doctor-arrow, .doctor-card-action svg { transition: none; }
}
</style>