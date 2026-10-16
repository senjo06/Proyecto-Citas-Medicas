<template>
  <div class="home-view">

    <header class="page-header">
      <h1>Agenda de Turnos Médicos</h1>
      <p class="subtitle">Seleccioná un especialista para ver su disponibilidad.</p>
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
        <div
          v-for="doc in doctors"
          :key="doc.name"
          class="doctor-card"
          @click="openDoctor(doc.name)"
        >
          <div class="doctor-avatar">{{ initials(doc.name) }}</div>
          <div class="doctor-info">
            <h3>{{ doc.name }}</h3>
            <span class="specialty-badge">{{ doc.specialty }}</span>
            <p class="doctor-slots-count">Ver disponibilidad</p>
          </div>
          <span class="doctor-arrow">›</span>
        </div>
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

    <!-- Modal: ya tiene turno ese día -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="conflictVisible" class="modal-overlay" @click.self="conflictVisible = false">
          <div class="modal-box">
            <h3>Ya tenés un turno reservado</h3>
            <p>Ya tenés un turno asignado para ese día.</p>
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
const pickDay   = (cell: { day: number; month: number; year: number }) => { selDay.value = cell.day; selMonth.value = cell.month; selYear.value = cell.year; };

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

onMounted(() => { loadAll(); loadMine(); });

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

const cancelTurn = async (appointmentId: number, reason: 'cancel' | 'change' = 'cancel') => {
  busy.value = true;
  errorMsg.value = null;
  const apt = myAppointments.value.find(a => a.id === appointmentId);
  try {
    await axios.delete(`${BASE}/api/appointments/${appointmentId}/cancel`);
    // Notificar al admin con mensaje diferente según el motivo
    if (apt) {
      const action = reason === 'change'
        ? `cambió su turno con ${apt.doctor_name} (${apt.specialty}) del ${formatDate(apt.appointment_date)} a las ${formatTime(apt.appointment_time)} por otro horario.`
        : `canceló su turno con ${apt.doctor_name} (${apt.specialty}) del ${formatDate(apt.appointment_date)} a las ${formatTime(apt.appointment_time)}.`;
      await axios.post(`${BASE}/api/notifications`, {
        userId,
        userName: authStore.user?.name ?? '',
        message: `${authStore.user?.name} ${action}`
      });
      allSlots.value.push(apt);
      allSlots.value.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.appointment_time.localeCompare(b.appointment_time));
    }
    myAppointments.value = myAppointments.value.filter(a => a.id !== appointmentId);
    successMsg.value = reason === 'change' ? 'Turno liberado. Seleccioná el nuevo horario.' : 'Turno cancelado correctamente.';
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'Error al cancelar.';
  } finally { busy.value = false; }
};

const cancelConflictAndBook = async () => {
  if (!conflictExistingId.value || !pendingSlotId.value) return;
  await cancelTurn(conflictExistingId.value, 'change');
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
.home-view { width: 100%; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.35rem; font-weight: 600; color: #111827; margin-bottom: 0.2rem; }
.subtitle { font-size: 0.85rem; color: #6b7280; }

/* Alertas */
.alert { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.9rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.88rem; font-weight: 500; }
.alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.alert-close { background: none; border: none; font-size: 1rem; cursor: pointer; opacity: 0.5; color: inherit; }
.alert-close:hover { opacity: 1; }
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.2s; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-6px); }

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
.doctors-grid { display: flex; flex-direction: column; gap: 0.5rem; }
.doctor-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem 1.1rem; display: flex; align-items: center; gap: 0.9rem; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
.doctor-card:hover { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37,99,235,0.06); }
.doctor-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; background: #eff6ff; color: #2563eb; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 1px solid #bfdbfe; }
.doctor-avatar.lg { width: 52px; height: 52px; font-size: 1.1rem; }
.doctor-info { flex: 1; }
.doctor-info h3 { font-size: 0.95rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem; }
.doctor-slots-count { font-size: 0.78rem; color: #9ca3af; margin-top: 0.2rem; }
.doctor-arrow { font-size: 1.2rem; color: #d1d5db; }
.doctor-card:hover .doctor-arrow { color: #2563eb; }

.specialty-badge { display: inline-block; background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.5rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; border: 1px solid #e2e8f0; }

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

@media (max-width: 860px) { .calendar-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .page-header h1 { font-size: 1.15rem; } }
</style>

.alert { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.93rem; font-weight: 500; }
.alert-success { background: #d4edda; color: #155724; border: 1px solid #b7dfbc; }
.alert-error   { background: #f8d7da; color: #721c24; border: 1px solid #f1b0b7; }
.alert-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; opacity: 0.6; color: inherit; }
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.25s; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-8px); }

/* Mis turnos */
.my-appointments { background: #e8f0fe; border: 1.5px solid #1a73e8; border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: 1.5rem; }
.my-title { font-size: 0.95rem; color: #0d47a1; font-weight: 700; margin-bottom: 0.75rem; }
.my-list { display: flex; flex-direction: column; gap: 0.6rem; }
.my-item { background: white; border-radius: 10px; padding: 0.8rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.my-item-info { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
.my-doctor { font-weight: 700; color: #0d47a1; font-size: 0.93rem; }
.my-date { font-size: 0.82rem; color: #555; }
.my-item-actions { display: flex; gap: 0.5rem; }
.btn-change { padding: 0.38rem 0.85rem; background: #fff3cd; color: #856404; border: 1px solid #ffc107; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.btn-change:hover { background: #ffc107; }
.btn-cancel-my { padding: 0.38rem 0.85rem; background: #ffeef0; color: #c62828; border: 1px solid #ef9a9a; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.btn-cancel-my:hover:not(:disabled) { background: #ffcdd2; }
.btn-cancel-my:disabled { opacity: 0.4; cursor: not-allowed; }

/* Estado */
.state-box { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; background: white; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); color: #777; }

/* Lista doctores */
.doctors-grid { display: flex; flex-direction: column; gap: 0.75rem; }
.doctor-card { background: white; border-radius: 14px; border: 1.5px solid #e8ecf0; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.18s; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.doctor-card:hover { border-color: #1a73e8; box-shadow: 0 4px 16px rgba(26,115,232,0.15); transform: translateX(4px); }
.doctor-avatar { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #1a73e8, #0d47a1); color: white; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.doctor-avatar.lg { width: 60px; height: 60px; font-size: 1.3rem; }
.doctor-info { flex: 1; }
.doctor-info h3 { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.3rem; }
.doctor-slots-count { font-size: 0.8rem; color: #888; margin-top: 0.3rem; }
.doctor-arrow { font-size: 1.5rem; color: #1a73e8; }

.specialty-badge { display: inline-block; background: #e8f0fe; color: #1557b0; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.4px; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; font-size: 0.88rem; color: #888; }
.btn-back { background: none; border: none; color: #1a73e8; font-size: 0.9rem; font-weight: 600; cursor: pointer; padding: 0; }
.btn-back:hover { text-decoration: underline; }

/* Doctor header */
.doctor-header-card { display: flex; align-items: center; gap: 1rem; background: white; border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: 1.25rem; border: 1px solid #e8ecf0; }
.doctor-header-card h2 { font-size: 1.1rem; color: #0d47a1; margin-bottom: 0.3rem; }

/* Layout calendario */
.calendar-layout { display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; align-items: start; }
.calendar-card { background: white; border-radius: 14px; padding: 1.25rem; border: 1px solid #e8ecf0; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.cal-month-label { font-size: 0.95rem; font-weight: 700; color: #0d47a1; }
.cal-nav-btn { background: #f0f4f8; border: none; border-radius: 7px; width: 30px; height: 30px; font-size: 1.1rem; cursor: pointer; color: #1a73e8; display: flex; align-items: center; justify-content: center; }
.cal-nav-btn:hover { background: #e8f0fe; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 0.35rem; }
.cal-weekdays span { text-align: center; font-size: 0.68rem; font-weight: 700; color: #aaa; text-transform: uppercase; }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
.cal-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 7px; font-size: 0.85rem; color: #555; position: relative; transition: all 0.12s; }
.cal-cell.empty  { pointer-events: none; }
.cal-cell.past   { color: #ccc; pointer-events: none; }
.cal-cell.sunday { color: #ffb3b3; pointer-events: none; }
.cal-cell.available { cursor: pointer; font-weight: 600; color: #0d47a1; background: #f0f4ff; }
.cal-cell.available:hover { background: #d2e3fc; transform: scale(1.08); }
.cal-cell.selected { background: #1a73e8 !important; color: white !important; font-weight: 700; box-shadow: 0 4px 12px rgba(26,115,232,0.4); }
.cal-dot { width: 5px; height: 5px; background: #1a73e8; border-radius: 50%; position: absolute; bottom: 2px; }
.cal-cell.selected .cal-dot { background: white; }
.cal-tag { font-size: 0.5rem; color: #e53935; font-weight: 700; position: absolute; bottom: 2px; }
.cal-legend { display: flex; gap: 0.75rem; margin-top: 0.75rem; justify-content: center; flex-wrap: wrap; }
.leg { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: #888; }
.leg-dot { width: 9px; height: 9px; border-radius: 50%; }
.leg-dot.avail  { background: #1a73e8; }
.leg-dot.sel    { background: #1a73e8; box-shadow: 0 0 0 2px white, 0 0 0 3px #1a73e8; }
.leg-dot.closed { background: #eee; border: 1px solid #ddd; }

/* Panel horarios */
.slots-panel { background: white; border-radius: 14px; padding: 1.5rem; border: 1px solid #e8ecf0; min-height: 240px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
.slots-empty { display: flex; align-items: center; justify-content: center; height: 180px; color: #aaa; font-size: 0.9rem; text-align: center; }
.slots-title { font-size: 1rem; color: #0d47a1; font-weight: 700; margin-bottom: 1rem; }
.slots-list { display: flex; flex-direction: column; gap: 0.6rem; }
.slot-item { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; border: 1.5px solid #e8ecf0; border-radius: 10px; transition: border-color 0.15s; }
.slot-item:hover { border-color: #1a73e8; }
.slot-time { font-size: 1.15rem; font-weight: 700; color: #0d47a1; }
.btn-book { padding: 0.5rem 1.2rem; background: linear-gradient(135deg,#1a73e8,#0d47a1); color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
.btn-book:hover:not(:disabled) { background: linear-gradient(135deg,#1557b0,#0a2d6e); box-shadow: 0 4px 12px rgba(26,115,232,0.3); }
.btn-book:disabled { background: #b0bec5; cursor: not-allowed; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box { background: white; border-radius: 16px; padding: 2rem; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.modal-box h3 { font-size: 1.15rem; color: #0d47a1; margin-bottom: 0.5rem; }
.modal-box p { font-size: 0.9rem; color: #555; }
.modal-warn { color: #e65100; font-size: 0.82rem; margin-top: 0.35rem; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: center; }
.btn-ghost { padding: 0.6rem 1.2rem; background: transparent; color: #555; border: 1.5px solid #ddd; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-ghost:hover { background: #f5f5f5; }
.btn-danger { padding: 0.6rem 1.4rem; background: #d32f2f; color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
.btn-danger:hover:not(:disabled) { background: #b71c1c; }
.btn-danger:disabled { background: #ef9a9a; cursor: not-allowed; }
.modal-enter-active, .modal-leave-active { transition: all 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.93); }

/* Spinners */
.spinner { width: 38px; height: 38px; border: 4px solid #e0e0e0; border-top-color: #1a73e8; border-radius: 50%; animation: spin 0.75s linear infinite; }
.spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.btn-outline { padding: 0.5rem 1rem; background: white; color: #1a73e8; border: 1.5px solid #1a73e8; border-radius: 7px; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
.btn-outline:hover { background: #e8f0fe; }

@media (max-width: 860px) { .calendar-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .page-header h1 { font-size: 1.5rem; } }
</style>
